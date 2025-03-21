import Image from "next/image"
import Link from "next/link"

const portfolioItems = [
  {
    id: 1,
    title: "Website Redesign",
    category: "Web Design",
    image: "/placeholder.svg",
    link: "/portfolio/website-redesign",
  },
  {
    id: 2,
    title: "Mobile App UI",
    category: "UI/UX Design",
    image: "/placeholder.svg",
    link: "/portfolio/mobile-app-ui",
  },
  {
    id: 3,
    title: "E-commerce Platform",
    category: "Web Development",
    image: "/placeholder.svg",
    link: "/portfolio/e-commerce-platform",
  },
  {
    id: 4,
    title: "Brand Identity",
    category: "Branding",
    image: "/placeholder.svg",
    link: "/portfolio/brand-identity",
  },
  {
    id: 5,
    title: "Dashboard Design",
    category: "UI/UX Design",
    image: "/placeholder.svg",
    link: "/portfolio/dashboard-design",
  },
  {
    id: 6,
    title: "Social Media Campaign",
    category: "Marketing",
    image: "/placeholder.svg",
    link: "/portfolio/social-media-campaign",
  },
]

export default function Portfolio() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Portfolio</h1>
      <p className="text-gray-300 mb-8">
        A showcase of my work in web development, design, and other creative projects.
      </p>

      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-800 pb-2">
          <span className="bg-orange-600 text-white px-2 py-1 text-xs">All</span>
          <span className="text-gray-400 text-xs py-1 hover:text-white cursor-pointer">Web Development</span>
          <span className="text-gray-400 text-xs py-1 hover:text-white cursor-pointer">UI/UX Design</span>
          <span className="text-gray-400 text-xs py-1 hover:text-white cursor-pointer">Branding</span>
          <span className="text-gray-400 text-xs py-1 hover:text-white cursor-pointer">Marketing</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioItems.map((item) => (
          <Link key={item.id} href={item.link}>
            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-orange-600 transition-colors">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                width={400}
                height={300}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1">{item.title}</h2>
                <p className="text-gray-400 text-sm">{item.category}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

