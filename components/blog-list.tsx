import Link from "next/link"

const blogPosts = [
  {
    id: 1,
    slug: "announcing-openai-sora",
    title: "Announcing OpenAI's Sora",
    date: "February 15, 2024",
    author: "Najib",
    excerpt: "Exploring the revolutionary AI model that generates realistic videos from text descriptions.",
    category: "AI",
    comments: 5,
  },
  {
    id: 2,
    slug: "faster-development-in-ai",
    title: "Faster Development in AI: Pushing to the Edge",
    date: "January 28, 2024",
    author: "Najib",
    excerpt:
      "A deep discussion on implementing modern language abstractions to be applied to the future of automation engines.",
    category: "Programming",
    comments: 3,
  },
  {
    id: 3,
    slug: "next-frontier-generative-ai",
    title: "The Next Frontier: Rise of Generative AI",
    date: "December 10, 2023",
    author: "Najib",
    excerpt: "My experiences jumping into the AI world and critical takeaways.",
    category: "AI",
    comments: 7,
  },
  {
    id: 4,
    slug: "ui-design-and-ux",
    title: "UI Design and UX/UX",
    date: "November 5, 2023",
    author: "Najib",
    excerpt:
      "How to effectively design through the history of UI elements, and learn how to match themes without performance.",
    category: "Design",
    comments: 2,
  },
  {
    id: 5,
    slug: "migrating-blog-insights-to-mysql",
    title: "Migrating Blog Insights to MySQL",
    date: "October 22, 2023",
    author: "Najib",
    excerpt: "Our experience upgrading the blog insights database to PostgreSQL MySQL.",
    category: "Database",
    comments: 4,
  },
  {
    id: 6,
    slug: "headless-cms-alternative",
    title: "Headless CMS: What's an alternative for traditional CMS",
    date: "September 30, 2023",
    author: "Najib",
    excerpt: "Learn how Headless CMS Model was built from the ground up to scale.",
    category: "CMS",
    comments: 6,
  },
  {
    id: 7,
    slug: "achieving-strong-online-presence",
    title: "Achieving strong online presence SEO and provide value",
    date: "August 18, 2023",
    author: "Najib",
    excerpt: "Learn how Headless CMS helps you provide tons of value on-the-web with SEO.",
    category: "SEO",
    comments: 3,
  },
]

interface BlogListProps {
  limit?: number
}

export default function BlogList({ limit }: BlogListProps) {
  const displayPosts = limit ? blogPosts.slice(0, limit) : blogPosts

  return (
    <div className="space-y-8">
      {displayPosts.map((post) => (
        <article key={post.id} className="border-b border-gray-800 pb-8">
          <h2 className="text-lg font-medium mb-1">
            <Link href={`/blog/${post.slug}`} className="hover:text-orange-500">
              {post.title}
            </Link>
            <span className="text-xs text-gray-500 ml-2">[{post.category}]</span>
          </h2>
          <div className="text-xs text-gray-500 mb-2">
            By {post.author} • {post.date}
          </div>
          <p className="text-gray-300 text-sm mb-2">{post.excerpt}</p>
          <div className="text-xs">
            <Link href={`/blog/${post.slug}#comments`} className="text-orange-500 hover:underline">
              Comments ({post.comments})
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}

