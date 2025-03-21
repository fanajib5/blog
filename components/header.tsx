"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

export default function Header() {
  const pathname = usePathname()
  const [quote, setQuote] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Life is what happens when you're busy making other plans. - John Lennon",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
    "In the middle of difficulty lies opportunity. - Albert Einstein",
    "The best way to predict the future is to create it. - Peter Drucker",
    "Creativity is intelligence having fun. - Albert Einstein",
    "The journey of a thousand miles begins with one step. - Lao Tzu",
    "Code is like humor. When you have to explain it, it's bad. - Cory House",
    "Design is not just what it looks like and feels like. Design is how it works. - Steve Jobs",
  ]

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)])
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="bg-black text-white">
      <div className="bg-orange-600 py-1 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="overflow-hidden whitespace-nowrap">
            <div className="animate-marquee inline-block">{quote}</div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold z-10">
            <span className="text-orange-600">Blogfolio</span> Najib
          </Link>

          {/* Mobile menu button */}
          <button className="md:hidden z-10" onClick={toggleMenu} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-4 text-sm">
              <li>
                <Link href="/" className={isActive("/") ? "text-orange-600" : "hover:text-orange-600"}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className={isActive("/about") ? "text-orange-600" : "hover:text-orange-600"}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/projects" className={isActive("/projects") ? "text-orange-600" : "hover:text-orange-600"}>
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/blog" className={isActive("/blog") ? "text-orange-600" : "hover:text-orange-600"}>
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className={isActive("/portfolio") ? "text-orange-600" : "hover:text-orange-600"}
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/contact" className={isActive("/contact") ? "text-orange-600" : "hover:text-orange-600"}>
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-95 z-0 flex items-center justify-center">
              <nav>
                <ul className="flex flex-col space-y-6 text-center text-lg">
                  <li>
                    <Link
                      href="/"
                      className={isActive("/") ? "text-orange-600" : "hover:text-orange-600"}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className={isActive("/about") ? "text-orange-600" : "hover:text-orange-600"}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/projects"
                      className={isActive("/projects") ? "text-orange-600" : "hover:text-orange-600"}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Projects
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className={isActive("/blog") ? "text-orange-600" : "hover:text-orange-600"}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/portfolio"
                      className={isActive("/portfolio") ? "text-orange-600" : "hover:text-orange-600"}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Portfolio
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className={isActive("/contact") ? "text-orange-600" : "hover:text-orange-600"}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
          padding-left: 100%;
        }
      `}</style>
    </header>
  )
}

