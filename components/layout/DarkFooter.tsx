import { Github, Search, Mail } from 'lucide-react'

export default function DarkFooter() {
  return (
    <footer
      className="py-16 text-center relative z-10"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <style>{`
        .dark-footer-icon { color: rgba(255,255,255,0.25); transition: color 0.2s; }
        .dark-footer-icon:hover { color: #c8a97e; }
      `}</style>
      <div className="max-w-6xl mx-auto px-6">
        <h2
          className="text-2xl font-black tracking-tighter mb-8"
          style={{ color: '#e8e8e8' }}
        >
          ARC<span style={{ color: '#c8a97e' }}>.</span>
        </h2>
        <div className="flex justify-center space-x-6 mb-8">
          <a
            href="https://github.com/Xavier7776"
            target="_blank"
            rel="noopener noreferrer"
            className="dark-footer-icon"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://www.bing.com"
            target="_blank"
            rel="noopener noreferrer"
            className="dark-footer-icon"
            aria-label="Bing"
          >
            <Search className="w-5 h-5" />
          </a>
          <a
            href="mailto:leonidasholya@gmail.com"
            className="dark-footer-icon"
            aria-label="Email"
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>
        <p
          className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ color: 'rgba(255,255,255,0.12)' }}
        >
          © {new Date().getFullYear()} Xavier. Built with Precision.
        </p>
      </div>
    </footer>
  )
}
