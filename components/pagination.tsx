import Link from "next/link"

export default function Pagination() {
  return (
    <div className="flex justify-center mt-10 text-sm border border-gray-800 p-4">
      <nav className="inline-flex items-center space-x-2">
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
  )
}

