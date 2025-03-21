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
  {
    id: 2,
    title: "Faster Development in AI: Pushing to the Edge",
    slug: "faster-development-in-ai",
    date: "January 28, 2024",
    author: "Najib",
    excerpt:
      "A deep discussion on implementing modern language abstractions to be applied to the future of automation engines.",
    content: `
# Faster Development in AI: Pushing to the Edge

The landscape of AI development is rapidly evolving, with a growing emphasis on edge computing and optimized language abstractions. This shift is enabling developers to create more efficient, responsive AI applications that can operate with reduced latency and lower bandwidth requirements.

## The Rise of Edge AI

Edge AI refers to AI algorithms that are processed locally on a hardware device, rather than in the cloud. This approach offers several advantages:

- Reduced latency for real-time applications
- Enhanced privacy as data doesn't need to leave the device
- Lower bandwidth usage and operational costs
- Continued functionality even without internet connectivity

## Modern Language Abstractions

Alongside the hardware advancements, we're seeing the development of new programming paradigms and language abstractions specifically designed for AI development. These abstractions allow developers to express complex AI operations more concisely and with better performance characteristics.

Frameworks like TensorFlow Lite, PyTorch Mobile, and ONNX Runtime are making it easier to deploy sophisticated models to edge devices, while domain-specific languages are emerging to address the unique challenges of AI development.

As these technologies continue to mature, we can expect to see AI capabilities becoming more deeply integrated into our everyday devices and applications, opening up new possibilities for automation and intelligent assistance.
    `,
    category: "Programming",
    comments: 3,
    coverImage: "https://source.unsplash.com/random/1200x630/?programming,code",
    seoKeywords: ["AI development", "edge computing", "language abstractions", "TensorFlow", "PyTorch"],
    seoDescription:
      "Explore how edge computing and modern language abstractions are accelerating AI development and enabling more efficient, responsive applications.",
    status: "published",
  },
  {
    id: 3,
    title: "The Next Frontier: Rise of Generative AI",
    slug: "next-frontier-generative-ai",
    date: "December 10, 2023",
    author: "Najib",
    excerpt: "My experiences jumping into the AI world and critical takeaways.",
    content: `
# The Next Frontier: Rise of Generative AI

My journey into the world of generative AI began about a year ago, and it's been nothing short of transformative. From text-to-image models like DALL-E and Midjourney to large language models like GPT-4, the capabilities of these systems have expanded at a breathtaking pace.

## Key Learnings

Throughout my exploration, I've gathered several critical insights that might be valuable for others entering this space:

1. **Prompt engineering is an art form.** The way you structure and phrase your prompts can dramatically affect the output quality. Being specific, providing context, and understanding the model's strengths and limitations are key.
2. **Iteration is essential.** Rarely will you get the perfect result on the first try. The best outcomes often come from a process of refinement and experimentation.
3. **Ethical considerations matter.** As these technologies become more powerful, questions about copyright, bias, and potential misuse become increasingly important.

## Practical Applications

I've found generative AI to be particularly valuable in several areas:

- Content creation and ideation
- Prototyping designs and concepts
- Automating repetitive writing tasks
- Learning and exploring new domains

While there's certainly hype surrounding these technologies, my experience has convinced me that generative AI represents a fundamental shift in how we interact with computers and create content. The potential for both creative expression and productivity enhancement is enormous.
    `,
    category: "AI",
    comments: 7,
    coverImage: "https://source.unsplash.com/random/1200x630/?artificial,intelligence",
    seoKeywords: ["generative AI", "DALL-E", "GPT-4", "prompt engineering", "AI ethics"],
    seoDescription:
      "Personal insights and key learnings from a year of exploring generative AI technologies, from prompt engineering to practical applications.",
    status: "published",
  },
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

    // First check if we're in a browser environment
    if (typeof window !== "undefined") {
      // In browser, return from fallback data
      const fallbackPost = fallbackBlogPosts.find((post) => post.slug === slug)
      return fallbackPost || null
    }

    // Server-side code
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

