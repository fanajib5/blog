"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { type BlogPost, getBlogPosts } from "@/lib/blog"

export default function Home() {
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPosts() {
      try {
        const posts = await getBlogPosts()
        setLatestPosts(posts.slice(0, 3))
      } catch (error) {
        console.error("Error loading posts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to Blogfolio Najib</h1>
        <p className="text-gray-300 mb-6 text-lg">
          A personal blog and portfolio showcasing my work, thoughts, and experiences in technology, design, and
          programming.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/blog" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
            Read Blog
          </Link>
          <Link href="/portfolio" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded">
            View Portfolio
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-bold mb-4">About Me</h2>
          <p className="text-gray-300 mb-4">
            I'm a passionate developer and designer with over 5 years of experience in web development, UI/UX design,
            and content creation.
          </p>
          <p className="text-gray-300 mb-4">
            My expertise includes modern web technologies like React, Next.js, and Tailwind CSS, as well as design tools
            like Figma and Adobe Creative Suite.
          </p>
          <Link href="/about" className="text-orange-500 hover:underline">
            Learn more about me →
          </Link>
        </div>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <Image
            src="https://source.unsplash.com/random/600x400/?developer,coding"
            alt="Najib"
            width={600}
            height={400}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border-b border-gray-800 pb-6">
                <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {latestPosts.map((post) => (
              <article key={post.id} className="border-b border-gray-800 pb-6">
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
            ))}
          </div>
        )}
        <div className="mt-6 text-right">
          <Link href="/blog" className="text-orange-500 hover:underline">
            View all posts →
          </Link>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-12">
        <h2 className="text-2xl font-bold mb-4">Let's Work Together</h2>
        <p className="text-gray-300 mb-4">
          I'm always open to new opportunities and collaborations. Whether you need a website, application, or design
          work, I'd love to hear from you.
        </p>
        <Link href="/contact" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded inline-block">
          Get in Touch
        </Link>
      </div>
    </div>
  )
}

