'use client'

import { Github, ExternalLink } from 'lucide-react'
import { useScrollReveal } from '@/lib/hooks'
import type { PROJECTS } from '@/lib/data'

type Project = (typeof PROJECTS)[number]

export default function ProjectItem({ project, index }: { project: Project; index: number }) {
  const [ref, isVisible] = useScrollReveal()

  return (
    <div
      ref={ref}
      className={`group p-8 md:p-10 rounded-3xl border border-gray-100 bg-white transition-all duration-1000 hover:shadow-2xl hover:shadow-blue-600/5 hover:-translate-y-2 hover:border-blue-500/20 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>
        <div className="flex gap-4">
          <a href={project.github} className="text-gray-300 hover:text-gray-900 transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <a href={project.demo} className="text-gray-300 hover:text-gray-900 transition-colors">
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
      <p className="text-gray-500 mb-8 leading-relaxed text-lg">{project.desc}</p>
      <div className="flex flex-wrap gap-2">
        {project.tech.map(t => (
          <span
            key={t}
            className="text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
