import Image from "next/image"
import Link from "next/link"

const projects = [
  {
    id: 1,
    title: "E-commerce Platform",
    description: "A full-featured e-commerce platform built with Next.js, Tailwind CSS, and Stripe integration.",
    image: "/placeholder.svg",
    tags: ["Next.js", "React", "Tailwind CSS", "Stripe"],
    link: "/projects/e-commerce",
  },
  {
    id: 2,
    title: "Portfolio Website",
    description: "A responsive portfolio website for a photographer showcasing their work with a modern design.",
    image: "/placeholder.svg",
    tags: ["HTML", "CSS", "JavaScript", "Responsive Design"],
    link: "/projects/portfolio-website",
  },
  {
    id: 3,
    title: "Task Management App",
    description: "A task management application with user authentication, task creation, and progress tracking.",
    image: "/placeholder.svg",
    tags: ["React", "Node.js", "MongoDB", "Express"],
    link: "/projects/task-management",
  },
  {
    id: 4,
    title: "Weather Dashboard",
    description: "A weather dashboard that displays current weather conditions and forecasts for multiple locations.",
    image: "/placeholder.svg",
    tags: ["JavaScript", "API Integration", "CSS Grid"],
    link: "/projects/weather-dashboard",
  },
]

export default function Projects() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <p className="text-gray-300 mb-8">
        Here are some of the projects I've worked on. Each project represents a unique challenge and solution.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <Image
              src={project.image || "/placeholder.svg"}
              alt={project.title}
              width={500}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
              <p className="text-gray-300 text-sm mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-800 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={project.link} className="text-orange-500 hover:text-orange-400 text-sm">
                View Project →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

