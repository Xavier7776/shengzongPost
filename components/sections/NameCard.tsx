'use client'

import { useState } from 'react'
import {
  Mail, Phone, MapPin, Link2, Github, Twitter,
  Copy, Download, Check, Quote,
} from 'lucide-react'

interface NameCardProps {
  name: string
  avatar: string
  title: string
  motto: string
  bio: string
  email: string
  phone: string | null
  location: string
  website: string | null
  githubUrl: string | null
  twitterUrl: string | null
  techStack: string[]
}

export default function NameCard({
  name, avatar, title, motto, bio, email, phone,
  location, website, githubUrl, twitterUrl, techStack,
}: NameCardProps) {
  const [copied, setCopied] = useState(false)

  function copyContact() {
    const lines = [name, title, email]
    if (phone) lines.push(phone)
    if (location) lines.push(location)
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadVCard() {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${name}`,
      `TITLE:${title}`,
      `EMAIL:${email}`,
      phone ? `TEL:${phone}` : '',
      location ? `ADR:;;${location};;;;` : '',
      website ? `URL:${website}` : '',
      githubUrl ? `X-SOCIALPROFILE;type=github:${githubUrl}` : '',
      twitterUrl ? `X-SOCIALPROFILE;type=twitter:${twitterUrl}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\r\n')
    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/\s+/g, '_')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 名片主体 */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

        {/* 渐变头部 */}
        <div className="relative h-36 bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)' }}
          />
        </div>

        {/* 头像浮出 */}
        <div className="relative px-8">
          <div className="-mt-20 mb-4 inline-block">
            <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="px-8 pb-8 space-y-5">
          {/* 基本信息 */}
          <div>
            <h2 className="text-2xl font-black text-gray-900">{name}</h2>
            <p className="text-blue-600 font-semibold text-sm mt-1">{title}</p>
            {motto && (
              <p className="text-gray-400 text-sm italic flex items-center gap-1.5 mt-2">
                <Quote className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                {motto}
              </p>
            )}
          </div>

          {/* 简介 */}
          <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>

          {/* 分隔线 */}
          <div className="border-t border-gray-100" />

          {/* 联系信息网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">邮箱</p>
                <p className="text-sm text-gray-700 font-medium truncate">{email}</p>
              </div>
            </div>

            {phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">手机</p>
                  <p className="text-sm text-gray-700 font-medium">{phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">所在地</p>
                <p className="text-sm text-gray-700 font-medium">{location}</p>
              </div>
            </div>

            {website && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">网站</p>
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank" rel="noreferrer"
                    className="text-sm text-blue-600 font-medium hover:underline truncate block"
                  >
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 社交图标 */}
          {(githubUrl || twitterUrl || website) && (
            <div className="flex items-center gap-3 pt-1">
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank" rel="noreferrer"
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                  title="GitHub"
                >
                  <Github className="w-4.5 h-4.5" />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank" rel="noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                  title="Twitter / X"
                >
                  <Twitter className="w-4.5 h-4.5" />
                </a>
              )}
              {website && (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank" rel="noreferrer"
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                  title="个人网站"
                >
                  <Link2 className="w-4.5 h-4.5" />
                </a>
              )}
            </div>
          )}

          {/* 技术栈 */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {techStack.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* 分隔线 */}
          <div className="border-t border-gray-100" />

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={copyContact}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制联系方式'}
            </button>
            <button
              onClick={downloadVCard}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              保存到通讯录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
