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
        if (!user.verified) return null
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.avatar ?? undefined,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'github') {
        const githubProfile = profile as { login?: string }
        return githubProfile?.login === process.env.ADMIN_GITHUB_USERNAME
      }
      return true
    },
    async session({ session, token }) {
      // ✅ 修复：先判断 session.user 存在再赋值，避免 TS 报 possibly undefined
      if (session.user) {
        if (token?.sub)     (session.user as { id?: string }).id = token.sub
        if (token?.role)    (session.user as { role?: string }).role = token.role as string
        if (token?.picture) session.user.image = token.picture as string
      }
      return session
    },
    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.sub = user.id
        token.role = (user as { role?: string }).role ?? 'user'
      }
      // 支持 update() 刷新 name 和 image
      if (trigger === 'update' && updateSession) {
        if (updateSession.name)  token.name    = updateSession.name
        if (updateSession.image) token.picture = updateSession.image
      }
      return token
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
}
