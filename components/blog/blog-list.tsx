"use client"

import { useState } from "react"
import BlogCard from "./blog-card"
import { useCMSData } from "@/hooks/use-cms-data"
import LoadingSpinner from "@/components/ui/loading-spinner"

interface BlogListProps {
  initialCategory?: string
  limit?: number
}

export default function BlogList({ initialCategory = "All Posts", limit }: BlogListProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)

  const {
    data: posts,
    loading,
    error,
  } = useCMSData({
    filterByStatus: "published",
    filterByCategory: activeCategory !== "All Posts" ? activeCategory : undefined,
    limit,
  })

  const categories = ["All Posts", "Programming", "Design", "AI", "Database", "CMS", "SEO"]

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>Error loading posts: {error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-900/50 hover:bg-red-900 rounded-md text-white"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {!limit && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-2 py-1 text-xs rounded ${
                  activeCategory === category ? "bg-orange-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No posts found in this category.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

