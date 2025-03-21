"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewPost() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [message, setMessage] = useState("")

  // Check if user is authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth")
    if (adminAuth !== "true") {
      router.push("/admin")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  const handleSave = () => {
    if (!title || !content) {
      setMessage("Title and content are required")
      return
    }

    setMessage("Post created! (Note: In this demo, changes are not actually persisted)")
    setTimeout(() => {
      router.push("/admin/dashboard")
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Post</h1>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
            disabled={!title || !content}
          >
            {status === "published" ? "Publish" : "Save as Draft"}
          </button>
          <Link href="/admin/dashboard" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Cancel
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`${message.includes("required") ? "bg-red-900/50 border-red-800 text-red-300" : "bg-green-900/50 border-green-800 text-green-300"} border px-4 py-3 rounded mb-6`}
        >
          {message}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-6">
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Enter post title"
          />
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono text-sm"
            placeholder="Write your post content in Markdown format"
          />
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Brief summary of your post"
          />
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">Select a category</option>
                <option value="AI">AI</option>
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Database">Database</option>
                <option value="CMS">CMS</option>
                <option value="SEO">SEO</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

