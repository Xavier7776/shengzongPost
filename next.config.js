/** @type {import('next').NextConfig} */

// 安全响应头：防护点击劫持、MIME 嗅探、XSS、信息泄露等
const securityHeaders = [
  // 防止点击劫持：禁止被 iframe 嵌套
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // 防止 MIME 嗅探：浏览器严格按 Content-Type 解析
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 控制 Referrer 信息泄露：只发送 origin 到跨源
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 禁用不必要的浏览器功能（摄像头/麦克风/地理位置等）
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // 阻止 DNS 预取泄露
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // HSTS：强制 HTTPS（生产环境生效，1 年 + 预加载）
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // 内容安全策略：限制资源加载源，防 XSS 注入
  // - ws/wss: 允许深度研究动态后端 WebSocket 连接
  // - GitHub avatars、unsplash、cloudinary 等图片源
  // - 'unsafe-inline' 样式：Next.js 内联样式需要
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' ws: wss: https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  // 移除 X-Powered-By: Next.js 响应头，避免暴露技术栈
  poweredByHeader: false,
  // 隐藏版本信息
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // 对所有路由应用安全头
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
