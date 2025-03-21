"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the blog post data based on the slug
    const fetchPost = async () => {
      try {
        // Replace with your actual data fetching logic
        // Example: const response = await fetch(`/api/posts/${params.slug}`);
        // const data = await response.json();
        // setPost(data);
        
        // Placeholder data for now
        setPost({
          title: `Blog Post: ${params.slug}`,
          content: "This is a blog post content."
        });
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {post ? (
        <article>
          <h1 className="text-3xl font-bold mb-6">{post.title}</h1>
          <div className="prose prose-invert">{post.content}</div>
        </article>
      ) : (
        <div>Post not found</div>
      )}
    </div>
  );
}
