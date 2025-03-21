"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { fallbackBlogPosts } from "@/lib/blog"

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const adminAuth = localStorage.getItem("adminAuth")
    if (adminAuth !== "true") {
      router.push("/admin")
    } else {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    router.push("/admin")
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Posts</h2>
          <p className="text-3xl font-bold text-orange-500">{fallbackBlogPosts.length}</p>
          <p className="text-gray-400 text-sm mt-1">Total blog posts</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Published</h2>
          <p className="text-3xl font-bold text-green-500">
            {fallbackBlogPosts.filter((post) => post.status === "published").length}
          </p>
          <p className="text-gray-400 text-sm mt-1">Published posts</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Drafts</h2>
          <p className="text-3xl font-bold text-yellow-500">
            {fallbackBlogPosts.filter((post) => post.status === "draft").length}
          </p>
          <p className="text-gray-400 text-sm mt-1">Draft posts</p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Blog Posts</h2>
        <Link href="/admin/new" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
          Create New Post
        </Link>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {fallbackBlogPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm">{post.title}</td>
                  <td className="px-4 py-3 text-sm">{post.category}</td>
                  <td className="px-4 py-3 text-sm">{post.date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        post.status === "published"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-yellow-900/30 text-yellow-400"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex space-x-2">
                      <Link href={`/admin/edit/${post.slug}`} className="text-blue-500 hover:text-blue-400">
                        Edit
                      </Link>
                      <Link href={`/blog/${post.slug}`} target="_blank" className="text-green-500 hover:text-green-400">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

