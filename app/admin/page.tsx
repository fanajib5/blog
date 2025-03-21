"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simple admin login instead of complex CMS integration
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    // Check if already logged in
    const isLoggedIn = localStorage.getItem("adminAuth") === "true"
    if (isLoggedIn) {
      window.location.href = "/admin/dashboard"
    }

    setIsLoading(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    // Simple demo login
    if (username === "admin" && password === "password") {
      localStorage.setItem("adminAuth", "true")
      window.location.href = "/admin/dashboard"
    } else {
      setLoginError("Invalid credentials. Try admin/password for demo.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-red-900/30 border border-red-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading Admin</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
            <Link href="/" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-gray-400 mt-2">Sign in to access the admin dashboard</p>
        </div>

        {loginError && (
          <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">{loginError}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
            />
          </div>

          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md">
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>For demo purposes, use:</p>
          <p className="text-gray-400">Username: admin</p>
          <p className="text-gray-400">Password: password</p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-orange-500 hover:underline">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  )
}

