import Image from 'next/image'
import Link from 'next/link'
import { Github, Search, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-20 text-center z-10 relative border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logo.png" alt="MindStack" width={32} height={32} className="w-8 h-8 rounded-full" />
          <h2 className="text-2xl font-black tracking-tighter">
            Mind<span className="text-blue-600">Stack</span>
          </h2>
        </div>
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
          <Link
            href="/projects#contact"
            className="text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="联系我"
          >
            <Mail className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-xs font-bold tracking-[0.2em] text-gray-300 uppercase">
          © {new Date().getFullYear()} MindStack. Built with Precision.
        </p>
      </div>
    </footer>
  )
}
