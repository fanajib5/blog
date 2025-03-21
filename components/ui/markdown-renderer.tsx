"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import ReactMarkdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <MarkdownSkeleton />,
})

// Dynamically import remark-gfm
const remarkGfm = dynamic(() => import("remark-gfm").then((mod) => mod.default), {
  ssr: false,
})

// Dynamically import syntax highlighter
const SyntaxHighlighter = dynamic(() => import("react-syntax-highlighter").then((mod) => mod.Prism), { ssr: false })

const atomDark = dynamic(() => import("react-syntax-highlighter/dist/esm/styles/prism").then((mod) => mod.atomDark), {
  ssr: false,
})

interface MarkdownRendererProps {
  content: string
  className?: string
}

function MarkdownSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-800 rounded w-3/4"></div>
      <div className="h-4 bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
      <div className="h-4 bg-gray-800 rounded w-4/5"></div>
      <div className="h-6 bg-gray-800 rounded w-2/3 mt-6"></div>
      <div className="h-4 bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
    </div>
  )
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Simple fallback renderer for when the component is not yet mounted
  if (!mounted) {
    return (
      <div
        className={`prose prose-invert prose-orange max-w-none ${className}`}
        dangerouslySetInnerHTML={{
          __html: content
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/^(?!<[uh]).*$/gm, (match) => {
              if (match.trim() === "") return ""
              return `<p class="mb-4">${match}</p>`
            }),
        }}
      />
    )
  }

  return (
    <ReactMarkdown
      className={`prose prose-invert prose-orange max-w-none ${className}`}
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        a: ({ node, ...props }) => <a className="text-orange-500 hover:underline" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-orange-500 pl-4 italic my-4" {...props} />
        ),
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          return !inline && match ? (
            <SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div" className="rounded-md my-4" {...props}>
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-gray-800 rounded px-1 py-0.5" {...props}>
              {children}
            </code>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

