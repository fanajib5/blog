"use client"

/**
 * Custom hook for fetching and managing CMS data
 */

import { useState, useEffect } from "react"
import { type BlogPost, fallbackBlogPosts } from "@/lib/blog"

interface UseCMSDataOptions {
  fallbackData?: BlogPost[]
  filterByStatus?: "published" | "draft" | "all"
  filterByCategory?: string
  limit?: number
}

export function useCMSData({
  fallbackData = fallbackBlogPosts,
  filterByStatus = "published",
  filterByCategory,
  limit,
}: UseCMSDataOptions = {}) {
  const [data, setData] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // In a real implementation, this would fetch from an API
        // For now, we'll use the fallback data with a small delay to simulate network
        await new Promise((resolve) => setTimeout(resolve, 300))

        let filteredData = [...fallbackData]

        // Apply status filter
        if (filterByStatus !== "all") {
          filteredData = filteredData.filter((item) => item.status === filterByStatus)
        }

        // Apply category filter
        if (filterByCategory && filterByCategory !== "All Posts") {
          filteredData = filteredData.filter((item) => item.category === filterByCategory)
        }

        // Apply limit
        if (limit) {
          filteredData = filteredData.slice(0, limit)
        }

        setData(filteredData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        console.error("Error fetching CMS data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fallbackData, filterByStatus, filterByCategory, limit])

  return { data, loading, error }
}

export function useCMSItem(slug: string, fallbackData = fallbackBlogPosts) {
  const [data, setData] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchItem() {
      try {
        setLoading(true)

        // In a real implementation, this would fetch from an API
        // For now, we'll use the fallback data with a small delay to simulate network
        await new Promise((resolve) => setTimeout(resolve, 300))

        const item = fallbackData.find((item) => item.slug === slug)

        if (item) {
          setData(item)
        } else {
          throw new Error(`Item with slug "${slug}" not found`)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        console.error("Error fetching CMS item:", err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchItem()
    }
  }, [slug, fallbackData])

  return { data, loading, error }
}

