"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { type BlogPost, getBlogPostBySlug } from "@/lib/blog"
import MarkdownContent from "@/components/markdown-content"
import MarkdownEditor from "@/components/markdown-editor"

export default function EditPost() {
  const params = useParams()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [seoKeywords, setSeoKeywords] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [previewMode, setPreviewMode] = useState(false)
  const [seoScore, setSeoScore] = useState(0)
  const [seoFeedback, setSeoFeedback] = useState<string[]>([])

  // Check if user is authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth")
    if (adminAuth !== "true") {
      router.push("/admin")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  // Load post data
  useEffect(() => {
    async function loadPost() {
      if (typeof params.slug !== "string") {
        router.push("/admin")
        return
      }

      try {
        const postData = await getBlogPostBySlug(params.slug)
        if (postData) {
          setPost(postData)
          setTitle(postData.title)
          setContent(postData.content)
          setExcerpt(postData.excerpt)
          setCategory(postData.category)
          setStatus(postData.status)
          setSeoKeywords(postData.seoKeywords.join(", "))
          setSeoDescription(postData.seoDescription)
          setCoverImage(postData.coverImage)
        } else {
          router.push("/admin")
        }
      } catch (error) {
        console.error("Error loading post:", error)
        router.push("/admin")
      }
    }

    if (isAuthenticated) {
      loadPost()
    }
  }, [params.slug, router, isAuthenticated])

  // Analyze SEO
  useEffect(() => {
    if (!title || !content || !seoDescription || !seoKeywords) return

    const feedback: string[] = []
    let score = 0

    // Title length check
    if (title.length < 30) {
      feedback.push("Title is too short (aim for 30-60 characters)")
    } else if (title.length > 60) {
      feedback.push("Title is too long (aim for 30-60 characters)")
    } else {
      score += 20
      feedback.push("✓ Title length is good")
    }

    // Content length check
    if (content.length < 300) {
      feedback.push("Content is too short (aim for at least 300 characters)")
    } else {
      score += 20
      feedback.push("✓ Content length is good")
    }

    // SEO description check
    if (seoDescription.length < 120) {
      feedback.push("SEO description is too short (aim for 120-160 characters)")
    } else if (seoDescription.length > 160) {
      feedback.push("SEO description is too long (aim for 120-160 characters)")
    } else {
      score += 20
      feedback.push("✓ SEO description length is good")
    }

    // Keywords check
    const keywordsArray = seoKeywords.split(",").map((k) => k.trim())
    if (keywordsArray.length < 3) {
      feedback.push("Too few keywords (aim for 3-7 keywords)")
    } else if (keywordsArray.length > 7) {
      feedback.push("Too many keywords (aim for 3-7 keywords)")
    } else {
      score += 20
      feedback.push("✓ Number of keywords is good")
    }

    // Check if keywords are in content
    const keywordsInContent = keywordsArray.filter((keyword) => content.toLowerCase().includes(keyword.toLowerCase()))

    if (keywordsInContent.length < keywordsArray.length) {
      feedback.push("Not all keywords are used in the content")
    } else {
      score += 20
      feedback.push("✓ All keywords are used in the content")
    }

    setSeoScore(score)
    setSeoFeedback(feedback)
  }, [title, content, seoDescription, seoKeywords])

  const handleSave = () => {
    // In a real app, this would save to a database
    alert("Changes saved! (Note: In this demo, changes are not actually persisted)")
    router.push("/admin")
  }

  const handlePublish = () => {
    setStatus("published")
    // In a real app, this would save to a database with published status
    alert("Post published! (Note: In this demo, changes are not actually persisted)")
    router.push("/admin")
  }

  const handleSaveAsDraft = () => {
    setStatus("draft")
    // In a real app, this would save to a database with draft status
    alert("Saved as draft! (Note: In this demo, changes are not actually persisted)")
    router.push("/admin")
  }

  if (!isAuthenticated || !post) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {previewMode ? "Edit Mode" : "Preview"}
          </button>
          {status === "draft" ? (
            <button onClick={handlePublish} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Publish
            </button>
          ) : (
            <button
              onClick={handleSaveAsDraft}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
            >
              Unpublish
            </button>
          )}
          <button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
            Save Changes
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="bg-gray-900 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <div className="text-sm text-gray-400 mb-6">
            By {post.author} • {post.date} • Category: {category} •
            <span className={status === "published" ? "text-green-400" : "text-yellow-400"}>
              {status === "published" ? " Published" : " Draft"}
            </span>
          </div>
          <MarkdownContent content={content} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
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
              />
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                Content (Markdown)
              </label>
              <MarkdownEditor
                value={content}
                onChange={setContent}
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
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Post Settings</h2>

              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "draft"}
                      onChange={() => setStatus("draft")}
                      className="text-orange-500 focus:ring-orange-500 h-4 w-4"
                    />
                    <span className="ml-2 text-yellow-400">Draft</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "published"}
                      onChange={() => setStatus("published")}
                      className="text-orange-500 focus:ring-orange-500 h-4 w-4"
                    />
                    <span className="ml-2 text-green-400">Published</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
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

              <div className="mb-4">
                <label htmlFor="coverImage" className="block text-sm font-medium mb-2">
                  Cover Image
                </label>
                <input
                  type="text"
                  id="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                {coverImage && (
                  <div className="mt-2 rounded overflow-hidden">
                    <img
                      src={coverImage || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">SEO Settings</h2>

              <div className="mb-4">
                <label htmlFor="seoDescription" className="block text-sm font-medium mb-2">
                  SEO Description (120-160 characters)
                </label>
                <textarea
                  id="seoDescription"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <div className="text-xs text-gray-400 mt-1">{seoDescription.length} characters</div>
              </div>

              <div className="mb-4">
                <label htmlFor="seoKeywords" className="block text-sm font-medium mb-2">
                  SEO Keywords (comma separated)
                </label>
                <input
                  type="text"
                  id="seoKeywords"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">SEO Analysis</h3>
                <div className="flex items-center mb-3">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        seoScore >= 80 ? "bg-green-500" : seoScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${seoScore}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">{seoScore}%</span>
                </div>
                <ul className="text-sm space-y-1">
                  {seoFeedback.map((feedback, index) => (
                    <li key={index} className={feedback.startsWith("✓") ? "text-green-400" : "text-gray-300"}>
                      {feedback}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

