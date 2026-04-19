import { Github, Search, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-20 text-center z-10 relative border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-black tracking-tighter mb-8">
          ARC<span className="text-blue-600">.</span>
        </h2>
        <div className="flex justify-center space-x-6 mb-8">
          <a
            href="https://github.com/Xavier7776"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://www.bing.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Bing"
          >
            <Search className="w-5 h-5" />
          </a>
          <a
            href="mailto:leonidasholya@gmail.com"
            className="text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Email"
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>
        <p className="text-xs font-bold tracking-[0.2em] text-gray-300 uppercase">
          © {new Date().getFullYear()} Xavier. Built with Precision.
        </p>
      </div>
    </footer>
  )
}
