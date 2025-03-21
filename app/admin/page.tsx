"use client"

import { useEffect } from "react"
import Script from "next/script"

export default function AdminPage() {
  useEffect(() => {
    // Initialize DecapCMS when the component mounts
    if (window.netlifyIdentity) {
      window.netlifyIdentity.on("init", (user) => {
        if (!user) {
          window.netlifyIdentity.on("login", () => {
            document.location.href = "/admin/"
          })
        }
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-black">
      {/* Load Netlify Identity Widget */}
      <Script src="https://identity.netlify.com/v1/netlify-identity-widget.js" strategy="beforeInteractive" />

      {/* Load DecapCMS */}
      <Script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js" strategy="afterInteractive" />

      {/* Custom styles for DecapCMS to match dark theme */}
      <style jsx global>{`
        /* Override DecapCMS styles to match dark theme */
        .nc-app-container {
          background-color: #111 !important;
          color: #fff !important;
        }
        
        /* Additional overrides can be added here */
      `}</style>

      {/* This div will be replaced by DecapCMS */}
      <div id="nc-root"></div>
    </div>
  )
}

