'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { type BlogPost, getBlogPosts } from '@/lib/blog'

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All Posts')
  
  useEffect(() => {
    async function loadPosts() {
      try {
        // This will only get published posts due to our updated getBlogPosts function
        const allPosts = await getBlogPosts()
        setPosts(allPosts)
      } catch (error) {
        console.error('Error loading posts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPosts()
  }, [])
  
  const categories = ['All Posts', 'Programming', 'Design', 'AI', 'Database', 'CMS', 'SEO']
  
  const filteredPosts = activeCategory === 'All Posts' 
    ? posts 
    : posts.filter(post => post.category === activeCategory)
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-800 rounded mb-8"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-8">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-4">Blog</h1>
        <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-2 mb-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-2 py-1 text-xs rounded ${
                activeCategory === category 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No posts found in this category.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPosts.map((post) => (
            <article key={post.id} className="border-b border-gray-800 pb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/4">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="rounded-lg overflow-hidden">
                      <Image 
                        src={post.coverImage || "/placeholder.svg"} 
                        alt={post.title}
                        width={300}
                        height={200}
                        className="w-full h-auto hover:opacity-80 transition-opacity"
                      />
                    </div>
                  </Link>
                </div>
                <div className="md:w-3/4">
                  <h2 className="text-lg font-medium mb-1">
                    <Link href={`/blog/${post.slug}`} className="hover:text-orange-500">
                      {post.title}
                    </Link>
                    <span className="text-xs text-gray-500 ml-2">[{post.category}]</span>
                  </h2>
                  <div className="text-xs text-gray-500 mb-2">
                    By {post.author} • {post.date}
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{post.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs">
                      <Link href={`/blog/${post.slug}#comments`} className="text-orange-500 hover:underline">
                        Comments ({post.comments})
                      </Link>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="text-orange-500 hover:underline text-sm">
                      Read more →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

