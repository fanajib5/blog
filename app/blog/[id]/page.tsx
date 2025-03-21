import Link from "next/link"
import { notFound } from "next/navigation"

const blogPosts = [
  {
    id: 1,
    title: "Announcing OpenAI's Sora",
    date: "February 15, 2024",
    author: "Najib",
    content: `
      <p>OpenAI has recently announced Sora, a groundbreaking AI model that can generate realistic videos from text descriptions. This technology represents a significant leap forward in the field of artificial intelligence and has the potential to revolutionize content creation.</p>
      
      <p>Sora can create videos up to a minute long while maintaining visual quality and adhering to the user's prompt. The model understands not just objects but also how they exist in the physical world and how they interact with each other.</p>
      
      <h2>Key Features of Sora</h2>
      
      <ul>
        <li>Generate videos up to 60 seconds long</li>
        <li>Create complex scenes with multiple characters</li>
        <li>Understand physics and natural interactions</li>
        <li>Maintain consistent characters throughout a video</li>
        <li>Generate videos with different styles and aesthetics</li>
      </ul>
      
      <p>While Sora is still in the research preview phase and not yet available to the public, it represents an exciting development in the field of AI-generated content. The potential applications range from filmmaking and education to marketing and entertainment.</p>
      
      <p>As with any powerful AI technology, there are also concerns about potential misuse. OpenAI is working with experts to assess safety risks and build in mitigations before making the technology widely available.</p>
    `,
    category: "AI",
    comments: 5,
  },
  {
    id: 2,
    title: "Faster Development in AI: Pushing to the Edge",
    date: "January 28, 2024",
    author: "Najib",
    content: `
      <p>The landscape of AI development is rapidly evolving, with a growing emphasis on edge computing and optimized language abstractions. This shift is enabling developers to create more efficient, responsive AI applications that can operate with reduced latency and lower bandwidth requirements.</p>
      
      <h2>The Rise of Edge AI</h2>
      
      <p>Edge AI refers to AI algorithms that are processed locally on a hardware device, rather than in the cloud. This approach offers several advantages:</p>
      
      <ul>
        <li>Reduced latency for real-time applications</li>
        <li>Enhanced privacy as data doesn't need to leave the device</li>
        <li>Lower bandwidth usage and operational costs</li>
        <li>Continued functionality even without internet connectivity</li>
      </ul>
      
      <h2>Modern Language Abstractions</h2>
      
      <p>Alongside the hardware advancements, we're seeing the development of new programming paradigms and language abstractions specifically designed for AI development. These abstractions allow developers to express complex AI operations more concisely and with better performance characteristics.</p>
      
      <p>Frameworks like TensorFlow Lite, PyTorch Mobile, and ONNX Runtime are making it easier to deploy sophisticated models to edge devices, while domain-specific languages are emerging to address the unique challenges of AI development.</p>
      
      <p>As these technologies continue to mature, we can expect to see AI capabilities becoming more deeply integrated into our everyday devices and applications, opening up new possibilities for automation and intelligent assistance.</p>
    `,
    category: "Programming",
    comments: 3,
  },
  {
    id: 3,
    title: "The Next Frontier: Rise of Generative AI",
    date: "December 10, 2023",
    author: "Najib",
    content: `
      <p>My journey into the world of generative AI began about a year ago, and it's been nothing short of transformative. From text-to-image models like DALL-E and Midjourney to large language models like GPT-4, the capabilities of these systems have expanded at a breathtaking pace.</p>
      
      <h2>Key Learnings</h2>
      
      <p>Throughout my exploration, I've gathered several critical insights that might be valuable for others entering this space:</p>
      
      <ol>
        <li><strong>Prompt engineering is an art form.</strong> The way you structure and phrase your prompts can dramatically affect the output quality. Being specific, providing context, and understanding the model's strengths and limitations are key.</li>
        <li><strong>Iteration is essential.</strong> Rarely will you get the perfect result on the first try. The best outcomes often come from a process of refinement and experimentation.</li>
        <li><strong>Ethical considerations matter.</strong> As these technologies become more powerful, questions about copyright, bias, and potential misuse become increasingly important.</li>
      </ol>
      
      <h2>Practical Applications</h2>
      
      <p>I've found generative AI to be particularly valuable in several areas:</p>
      
      <ul>
        <li>Content creation and ideation</li>
        <li>Prototyping designs and concepts</li>
        <li>Automating repetitive writing tasks</li>
        <li>Learning and exploring new domains</li>
      </ul>
      
      <p>While there's certainly hype surrounding these technologies, my experience has convinced me that generative AI represents a fundamental shift in how we interact with computers and create content. The potential for both creative expression and productivity enhancement is enormous.</p>
    `,
    category: "AI",
    comments: 7,
  },
]

export default function BlogPost({ params }: { params: { id: string } }) {
  const post = blogPosts.find((post) => post.id === Number.parseInt(params.id))

  if (!post) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/blog" className="text-orange-500 hover:underline mb-4 inline-block">
          ← Back to Blog
        </Link>
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm text-gray-400 mb-6">
          By {post.author} • {post.date} • Category: {post.category}
        </div>
      </div>

      <div className="prose prose-invert prose-orange max-w-none mb-8">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

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

