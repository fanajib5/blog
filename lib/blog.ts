import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface BlogPost {
  id: number
  title: string
  slug: string
  date: string
  author: string
  excerpt: string
  content: string
  category: string
  comments: number
  coverImage: string
  seoKeywords: string[]
  seoDescription: string
  status: "draft" | "published"
}

// Function to read markdown files from the content directory
const getMarkdownFiles = (dir: string) => {
  try {
    const contentDir = path.join(process.cwd(), dir)
    if (!fs.existsSync(contentDir)) {
      return []
    }
    return fs.readdirSync(contentDir).filter((file) => file.endsWith(".md"))
  } catch (error) {
    console.error("Error reading markdown files:", error)
    return []
  }
}

// Function to parse markdown files
const parseMarkdownFile = (filePath: string, id: number): BlogPost => {
  const fileContents = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(fileContents)

  return {
    id,
    title: data.title || "",
    slug: data.slug || "",
    date: data.date
      ? new Date(data.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "",
    author: data.author || "Najib",
    excerpt: data.excerpt || "",
    content: content || "",
    category: data.category || "Uncategorized",
    comments: data.comments || 0,
    coverImage: data.coverImage || "/placeholder.svg",
    seoKeywords: data.seoKeywords || [],
    seoDescription: data.seoDescription || "",
    status: data.status || "draft",
  }
}

// Fallback data for when no content files exist yet
export const fallbackBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Announcing OpenAI's Sora",
    slug: "announcing-openai-sora",
    date: "February 15, 2024",
    author: "Najib",
    excerpt: "Exploring the revolutionary AI model that generates realistic videos from text descriptions.",
    content: `
# Announcing OpenAI's Sora

OpenAI has recently announced Sora, a groundbreaking AI model that can generate realistic videos from text descriptions. This technology represents a significant leap forward in the field of artificial intelligence and has the potential to revolutionize content creation.

Sora can create videos up to a minute long while maintaining visual quality and adhering to the user's prompt. The model understands not just objects but also how they exist in the physical world and how they interact with each other.

## Key Features of Sora

- Generate videos up to 60 seconds long
- Create complex scenes with multiple characters
- Understand physics and natural interactions
- Maintain consistent characters throughout a video
- Generate videos with different styles and aesthetics

While Sora is still in the research preview phase and not yet available to the public, it represents an exciting development in the field of AI-generated content. The potential applications range from filmmaking and education to marketing and entertainment.

As with any powerful AI technology, there are also concerns about potential misuse. OpenAI is working with experts to assess safety risks and build in mitigations before making the technology widely available.
    `,
    category: "AI",
    comments: 5,
    coverImage: "https://source.unsplash.com/random/1200x630/?ai,technology",
    seoKeywords: ["OpenAI", "Sora", "AI video generation", "text-to-video", "artificial intelligence"],
    seoDescription:
      "Learn about OpenAI's groundbreaking Sora model that generates realistic videos from text descriptions and its potential impact on content creation.",
    status: "published",
  },
  // Add more fallback posts as needed
]

// Get all blog posts
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const contentDir = "content/blog"
    const files = getMarkdownFiles(contentDir)

    if (files.length === 0) {
      return fallbackBlogPosts.filter((post) => post.status === "published")
    }

    const posts = files
      .map((filename, index) => {
        const filePath = path.join(process.cwd(), contentDir, filename)
        return parseMarkdownFile(filePath, index + 1)
      })
      .filter((post) => post.status === "published")

    // Sort by date (newest first)
    return posts.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  } catch (error) {
    console.error("Error getting blog posts:", error)
    return fallbackBlogPosts.filter((post) => post.status === "published")
  }
}

// Get all blog posts including drafts (for admin)
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const contentDir = "content/blog"
    const files = getMarkdownFiles(contentDir)

    if (files.length === 0) {
      return fallbackBlogPosts
    }

    const posts = files.map((filename, index) => {
      const filePath = path.join(process.cwd(), contentDir, filename)
      return parseMarkdownFile(filePath, index + 1)
    })

    // Sort by date (newest first)
    return posts.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  } catch (error) {
    console.error("Error getting all blog posts:", error)
    return fallbackBlogPosts
  }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const contentDir = "content/blog"
    const files = getMarkdownFiles(contentDir)

    if (files.length === 0) {
      const fallbackPost = fallbackBlogPosts.find((post) => post.slug === slug)
      return fallbackPost || null
    }

    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(process.cwd(), contentDir, files[i])
      const post = parseMarkdownFile(filePath, i + 1)

      if (post.slug === slug) {
        return post
      }
    }

    return null
  } catch (error) {
    console.error("Error getting blog post by slug:", error)
    const fallbackPost = fallbackBlogPosts.find((post) => post.slug === slug)
    return fallbackPost || null
  }
}

// Get blog posts by category
export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts()
    return posts.filter((post) => post.category.toLowerCase() === category.toLowerCase())
  } catch (error) {
    console.error("Error getting blog posts by category:", error)
    return fallbackBlogPosts.filter(
      (post) => post.category.toLowerCase() === category.toLowerCase() && post.status === "published",
    )
  }
}

