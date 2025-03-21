/**
 * CMS integration layer
 * This file handles all interactions with DecapCMS
 */

import type { BlogPost } from "./blog"

// Configuration for DecapCMS backend
export const cmsConfig = {
  backend: {
    name: "git-gateway",
    branch: "main",
  },
  local_backend: process.env.NODE_ENV === "development",
  media_folder: "public/images/uploads",
  public_folder: "/images/uploads",
  collections: [
    {
      name: "blog",
      label: "Blog Posts",
      folder: "content/blog",
      create: true,
      slug: "{{slug}}",
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Slug", name: "slug", widget: "string" },
        { label: "Publish Date", name: "date", widget: "datetime" },
        { label: "Author", name: "author", widget: "string", default: "Najib" },
        { label: "Cover Image", name: "coverImage", widget: "image" },
        { label: "Excerpt", name: "excerpt", widget: "text" },
        {
          label: "Category",
          name: "category",
          widget: "select",
          options: ["AI", "Programming", "Design", "Database", "CMS", "SEO"],
        },
        { label: "Content", name: "content", widget: "markdown" },
        { label: "SEO Description", name: "seoDescription", widget: "text" },
        { label: "SEO Keywords", name: "seoKeywords", widget: "list" },
        {
          label: "Status",
          name: "status",
          widget: "select",
          options: ["draft", "published"],
          default: "draft",
        },
        { label: "Comments Count", name: "comments", widget: "number", default: 0 },
      ],
    },
    {
      name: "pages",
      label: "Pages",
      folder: "content/pages",
      create: true,
      slug: "{{slug}}",
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Slug", name: "slug", widget: "string" },
        { label: "Content", name: "content", widget: "markdown" },
        { label: "SEO Description", name: "seoDescription", widget: "text" },
        { label: "SEO Keywords", name: "seoKeywords", widget: "list" },
      ],
    },
  ],
}

// Function to initialize CMS
export function initCMS() {
  if (typeof window !== "undefined") {
    // Only load CMS on client side
    import("decap-cms-app").then((CMS) => {
      // Register the CMS
      CMS.init({ config: cmsConfig })
    })
  }
}

// Function to authenticate with Netlify Identity
export function initNetlifyIdentity() {
  if (typeof window !== "undefined" && window.netlifyIdentity) {
    window.netlifyIdentity.on("init", (user) => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/"
        })
      }
    })
  }
}

// Function to fetch posts from CMS (in a real app, this would fetch from an API)
export async function fetchPosts(): Promise<BlogPost[]> {
  // In a real implementation, this would fetch from an API
  // For now, we'll use the fallback data
  return Promise.resolve([])
}

