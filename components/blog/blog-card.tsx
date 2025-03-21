import Link from "next/link"
import Image from "next/image"
import type { BlogPost } from "@/lib/blog"

interface BlogCardProps {
  post: BlogPost
  variant?: "compact" | "full"
}

export default function BlogCard({ post, variant = "full" }: BlogCardProps) {
  if (variant === "compact") {
    return (
      <article className="border-b border-gray-800 pb-6">
        <h3 className="text-lg font-medium mb-1">
          <Link href={`/blog/${post.slug}`} className="hover:text-orange-500">
            {post.title}
          </Link>
          <span className="text-xs text-gray-500 ml-2">[{post.category}]</span>
        </h3>
        <div className="text-xs text-gray-500 mb-2">
          By {post.author} • {post.date}
        </div>
        <p className="text-gray-300 text-sm mb-2">{post.excerpt}</p>
        <div className="text-xs">
          <Link href={`/blog/${post.slug}`} className="text-orange-500 hover:underline">
            Read more →
          </Link>
        </div>
      </article>
    )
  }

  return (
    <article className="border-b border-gray-800 pb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4">
          <Link href={`/blog/${post.slug}`}>
            <div className="rounded-lg overflow-hidden">
              <Image
                src={post.coverImage || "/placeholder.svg?height=200&width=300"}
                alt={post.title}
                width={300}
                height={200}
                className="w-full h-auto hover:opacity-80 transition-opacity"
              />
            </div>
          </Link>
        </div>
        <div className="md:w-3/4">
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
          <div className="flex justify-between items-center">
            <div className="text-xs">
              <Link href={`/blog/${post.slug}#comments`} className="text-orange-500 hover:underline">
                Comments ({post.comments})
              </Link>
            </div>
            <Link href={`/blog/${post.slug}`} className="text-orange-500 hover:underline text-sm">
              Read more →
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

