/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // 解决 isomorphic-dompurify 的 ESM 兼容性问题
  serverComponentsExternalPackages: ['isomorphic-dompurify'],
}

module.exports = nextConfig
