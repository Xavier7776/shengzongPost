import { Github, Search, Mail } from 'lucide-react'
import Link from 'next/link'
import FooterLogo from './FooterLogo'

export default function Footer() {
  return (
    <footer className="py-10 md:py-20 text-center z-10 relative border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-center gap-2 md:gap-2.5 mb-5 md:mb-8">
          <FooterLogo />
          <h2 className="text-lg md:text-2xl font-black tracking-tighter">
            Mind<span className="text-blue-600">Stack</span>
          </h2>
        </div>
        <div className="flex justify-center items-center gap-3 md:gap-6 mb-5 md:mb-8">
          <a
            href="https://github.com/Xavier7776"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-900 transition-colors p-2 -m-2 md:p-0 md:-m-0"
            aria-label="GitHub"
          >
            <Github className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </a>
          <Link
            href="/search"
            className="text-gray-400 hover:text-gray-900 transition-colors p-2 -m-2 md:p-0 md:-m-0"
            aria-label="搜索"
          >
            <Search className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </Link>
          <Link
            href="/projects#contact"
            className="text-gray-400 hover:text-gray-900 transition-colors p-2 -m-2 md:p-0 md:-m-0"
            aria-label="联系我"
          >
            <Mail className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </Link>
        </div>
        <p className="text-[10px] md:text-xs font-bold tracking-[0.1em] md:tracking-[0.2em] text-gray-300 uppercase whitespace-nowrap">
          © {new Date().getFullYear()} MindStack. Built with Precision.
        </p>
      </div>
    </footer>
  )
}
