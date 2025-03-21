import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 text-sm">
      <div className="container mx-auto px-4 py-8">
        {/* Pagination at the top of footer */}
        <div className="border border-gray-800 p-4 mb-8 overflow-x-auto">
          <nav className="flex justify-center items-center space-x-2 min-w-max">
            <Link href="#" className="px-2 text-gray-400 hover:text-white">
              ← Previous
            </Link>
            <Link href="#" className="px-2 py-1 text-orange-500 hover:text-white">
              1
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              2
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              3
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              4
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              5
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              6
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              7
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              8
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              9
            </Link>
            <Link href="#" className="px-2 py-1 text-blue-500 hover:text-white">
              10
            </Link>
            <Link href="#" className="px-2 text-blue-500 hover:text-white">
              Next →
            </Link>
          </nav>
        </div>

        {/* Main footer content */}
        <div className="border border-dashed border-gray-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <div className="border-b sm:border-r sm:border-b-0 border-dashed border-gray-700 pb-4 sm:pb-0 sm:pr-4">
              <h3 className="font-bold text-white mb-4 underline">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-white">
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div className="border-b md:border-r md:border-b-0 border-dashed border-gray-700 pb-4 md:pb-0 md:pr-4">
              <h3 className="font-bold text-white mb-4 underline">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/case-studies" className="hover:text-white">
                    Case studies
                  </Link>
                </li>
                <li>
                  <Link href="/enterprise" className="text-orange-500 hover:text-white">
                    Enterprise
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-green-500 hover:text-white">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div className="border-b sm:border-b-0 sm:border-r border-dashed border-gray-700 pb-4 sm:pb-0 sm:pr-4 lg:col-span-1">
              <h3 className="font-bold text-white mb-4 underline">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/documentation" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-white">
                    Status
                  </Link>
                </li>
                <li>
                  <Link href="/trust-center" className="hover:text-white">
                    Trust Center
                  </Link>
                </li>
              </ul>
            </div>
            <div className="border-b lg:border-b-0 lg:border-r border-dashed border-gray-700 pb-4 lg:pb-0 lg:pr-4">
              <h3 className="font-bold text-white mb-4 underline">Courses</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/courses/database-scaling" className="hover:text-white">
                    Database Scaling
                  </Link>
                </li>
                <li>
                  <Link href="/courses/learn-vitess" className="hover:text-white">
                    Learn Vitess
                  </Link>
                </li>
                <li>
                  <Link href="/courses/mysql-for-developers" className="hover:text-white">
                    MySQL for Developers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4 underline">Open source</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/open-source/vitess" className="hover:text-white">
                    Vitess
                  </Link>
                </li>
                <li>
                  <Link href="/open-source/vitess-community" className="hover:text-white">
                    Vitess community
                  </Link>
                </li>
                <li>
                  <Link href="https://github.com" className="hover:text-white">
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-700 mt-8 pt-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <span className="text-gray-600 hidden sm:inline">|</span>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
              <span className="text-gray-600 hidden sm:inline">|</span>
              <Link href="/cookies" className="hover:text-white">
                Cookies
              </Link>
              <span className="text-gray-600 hidden sm:inline">|</span>
              <Link href="/do-not-share" className="hover:text-white">
                Do Not Share My Personal Information
              </Link>
            </div>
            <div className="text-gray-500">© 2025 Blogfolio Najib. All rights reserved.</div>
          </div>
        </div>

        {/* Social links */}
        <div className="mt-6 flex flex-wrap gap-4 sm:gap-0 sm:space-x-4">
          <Link href="https://github.com" className="hover:text-white">
            GitHub
          </Link>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <Link href="https://twitter.com" className="hover:text-white">
            X
          </Link>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <Link href="https://linkedin.com" className="hover:text-white">
            LinkedIn
          </Link>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <Link href="https://youtube.com" className="hover:text-white">
            YouTube
          </Link>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <Link href="https://facebook.com" className="hover:text-white">
            Facebook
          </Link>
        </div>
      </div>
    </footer>
  )
}

