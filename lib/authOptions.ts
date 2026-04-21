// lib/authOptions.ts
import GitHub from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import bcrypt from 'bcryptjs'
import { getUserByEmail } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await getUserByEmail(credentials.email)
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        // 邮箱未验证，拒绝登录
        if (!user.verified) return null

        return { id: String(user.id), name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // GitHub 登录：只允许管理员
      if (account?.provider === 'github') {
        const githubProfile = profile as { login?: string }
        return githubProfile?.login === process.env.ADMIN_GITHUB_USERNAME
      }
      // Credentials 登录：普通用户，authorize 已做验证，这里直接放行
      return true
    },
    async session({ session, token }) {
      if (token?.sub) {
        (session.user as { id?: string }).id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
}
