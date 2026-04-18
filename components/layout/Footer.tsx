import { Github, Image as ImageIcon, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-20 text-center z-10 relative border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-black tracking-tighter mb-8">
          ARC<span className="text-blue-600">.</span>
        </h2>
        <div className="flex justify-center space-x-6 mb-8">
          <Github className="w-5 h-5 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors" />
          <ImageIcon className="w-5 h-5 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors" />
          <Mail className="w-5 h-5 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors" />
        </div>
        <p className="text-xs font-bold tracking-[0.2em] text-gray-300 uppercase">
          © {new Date().getFullYear()} ARC Architecture & Design. Built with Precision.
        </p>
      </div>
    </footer>
  )
}
