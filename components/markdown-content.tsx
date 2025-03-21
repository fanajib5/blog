"use client"

interface MarkdownContentProps {
  content: string
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  // Simple markdown renderer that handles basic formatting
  // This is a simplified version to avoid potential issues with the full ReactMarkdown library
  const formatMarkdown = (text: string) => {
    // Convert headers
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    text = text.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')

    // Convert bold
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Convert italic
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Convert lists
    text = text.replace(/^- (.*$)/gm, '<li class="ml-5">$1</li>')
    text = text.replace(/(<li.*<\/li>)/s, '<ul class="list-disc mb-4">$1</ul>')

    // Convert paragraphs (must be done last)
    text = text.replace(/^(?!<[uh]|<li).*$/gm, (match) => {
      if (match.trim() === "") return ""
      return `<p class="mb-4">${match}</p>`
    })

    return text
  }

  return (
    <div
      className="prose prose-invert prose-orange max-w-none"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  )
}

