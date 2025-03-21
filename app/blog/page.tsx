"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch blog posts
    const fetchPosts = async () => {
      try {
        // Replace with your actual data fetching logic
        // Example: const response = await fetch('/api/posts');
        // const data = await response.json();
        // setPosts(data);
        
        // Placeholder data for now
        setPosts([
          { slug: 'first-post', title: 'First Blog Post' },
          { slug: 'second-post', title: 'Second Blog Post' },
          { slug: 'third-post', title: 'Third Blog Post' },
        ]);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>
      
      <div className="grid gap-6">
        {posts.map((post) => (
          <Link 
            href={`/blog/${post.slug}`} 
            key={post.slug}
            className="p-4 border border-gray-700 rounded-lg hover:bg-gray-900 transition"
          >
            <h2 className="text-xl font-semibold">{post.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
