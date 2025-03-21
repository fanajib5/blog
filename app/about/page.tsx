import Image from "next/image"

export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About Me</h1>

      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="md:w-1/3">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <Image src="/placeholder.svg" alt="Najib" width={300} height={300} className="w-full h-auto" />
          </div>
        </div>

        <div className="md:w-2/3">
          <h2 className="text-2xl font-semibold mb-4">Najib</h2>
          <p className="text-gray-300 mb-4">
            I'm a passionate developer and designer with over 5 years of experience in web development, UI/UX design,
            and content creation. I specialize in building modern, responsive websites and applications using the latest
            technologies.
          </p>
          <p className="text-gray-300 mb-4">
            My journey in technology began when I was in college, where I discovered my love for coding and
            problem-solving. Since then, I've worked on numerous projects, from small personal websites to large
            enterprise applications.
          </p>
          <p className="text-gray-300">
            When I'm not coding, you can find me exploring new technologies, writing blog posts, or contributing to
            open-source projects.
          </p>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-medium mb-2">Frontend</h3>
            <ul className="text-gray-300 text-sm">
              <li>HTML/CSS</li>
              <li>JavaScript/TypeScript</li>
              <li>React/Next.js</li>
              <li>Tailwind CSS</li>
            </ul>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-medium mb-2">Backend</h3>
            <ul className="text-gray-300 text-sm">
              <li>Node.js</li>
              <li>Express</li>
              <li>Python</li>
              <li>PHP</li>
            </ul>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-medium mb-2">Design</h3>
            <ul className="text-gray-300 text-sm">
              <li>UI/UX Design</li>
              <li>Figma</li>
              <li>Adobe XD</li>
              <li>Photoshop</li>
            </ul>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-medium mb-2">Other</h3>
            <ul className="text-gray-300 text-sm">
              <li>Git/GitHub</li>
              <li>Docker</li>
              <li>AWS</li>
              <li>SEO</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

