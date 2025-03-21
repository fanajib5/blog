"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import "easymde/dist/easymde.min.css"

// Dynamically import SimpleMDE to avoid SSR issues
const SimpleMDE = dynamic(() => import("react-simplemde-editor").then((mod) => mod.default), { ssr: false })

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false)

  // Wait until component is mounted to render the editor
  useEffect(() => {
    setMounted(true)
  }, [])

  const options = {
    autofocus: false,
    spellChecker: false,
    placeholder: placeholder || "Write your content here...",
    status: ["lines", "words", "cursor"],
    toolbar: [
      "bold",
      "italic",
      "heading",
      "|",
      "quote",
      "unordered-list",
      "ordered-list",
      "|",
      "link",
      "image",
      "|",
      "preview",
      "side-by-side",
      "fullscreen",
      "|",
      "guide",
    ],
    previewRender: (plainText: string) => {
      // You could use a more sophisticated markdown renderer here
      return `<div class="markdown-preview">${plainText}</div>`
    },
  }

  if (!mounted) {
    return (
      <div className="border border-gray-700 rounded-md p-4 bg-gray-800 h-64">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return <SimpleMDE value={value} onChange={onChange} options={options} />
}

