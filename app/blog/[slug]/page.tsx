"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { BlogPost as BlogPostType } from "@/lib/blog"
import { fallbackBlogPosts } from "@/lib/blog"
import MarkdownContent from "@/components/markdown-content"

export default function BlogPost() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<BlogPostType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    function loadPost() {
      if (typeof params.slug !== "string") {
        router.push("/blog")
        return
      }

      try {
        // For client-side, use the fallback data directly
        const fallbackPost = fallbackBlogPosts.find((post) => post.slug === params.slug)

        if (fallbackPost) {
          setPost(fallbackPost)
        } else {
          setError(new Error("Post not found"))
          router.push("/blog")
        }
      } catch (err) {
        console.error("Error loading post:", err)
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        router.push("/blog")
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [params.slug, router])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-800 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading Post</h2>
          <p className="text-gray-300 mb-6">{error?.message || "Post not found"}</p>
          <Link href="/blog" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
            Return to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <Link href="/blog" className="text-orange-500 hover:underline mb-4 inline-block">
          ← Back to Blog
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm text-gray-400 mb-4">
          By {post.author} • {post.date} • Category: {post.category}
        </div>

        {/* SEO Keywords */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.seoKeywords.map((keyword, index) => (
            <span key={index} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
              #{keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Cover Image */}
      <div className="mb-8 rounded-lg overflow-hidden">
        <Image
          src={post.coverImage || "/placeholder.svg?height=630&width=1200"}
          alt={post.title}
          width={1200}
          height={630}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Markdown Content */}
      <MarkdownContent content={post.content} />

      <div className="border-t border-gray-800 pt-6 mt-8">
        <h2 className="text-xl font-semibold mb-4" id="comments">
          Comments ({post.comments})
        </h2>

        {/* Placeholder for comments */}
        <div className="space-y-4">
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-medium">John Doe</span>
              <span className="text-sm text-gray-400">2 days ago</span>
            </div>
            <p className="text-gray-300 text-sm">
              Great article! I've been following the developments in this area and your insights are spot on.
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Jane Smith</span>
              <span className="text-sm text-gray-400">1 week ago</span>
            </div>
            <p className="text-gray-300 text-sm">
              I'd love to see a follow-up article that goes deeper into the technical aspects. Thanks for sharing!
            </p>
          </div>
        </div>

        {/* Comment form */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Leave a Comment</h3>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-1">
                Comment
              </label>
              <textarea
                id="comment"
                rows={4}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              ></textarea>
            </div>

            <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md">
              Submit Comment
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

