// lib/authOptions.ts
import GitHub from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import bcrypt from 'bcryptjs'
import { getUserByEmail, getUserById } from '@/lib/db'
import { allowAuthAttempt, normalizeEmail } from '@/lib/auth-rate-limit'

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
      async authorize(credentials, req) {
        const email = normalizeEmail(credentials?.email)
        if (!email || typeof credentials?.password !== 'string') return null
        try {
          // NextAuth passes the incoming headers as a plain object; identity and IP quotas
          // are shared in Neon across all Vercel instances and apply to failed logins.
          const authRequest = new Request('https://auth.internal/', {
            headers: req?.headers as HeadersInit | undefined,
          })
          if (!await allowAuthAttempt(authRequest, 'login', email)) return null
        } catch (error) {
          console.error('[auth] login throttling unavailable', error)
          return null // fail closed rather than allow unlimited online password guessing
        }
        const user = await getUserByEmail(email)
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
      if (session.user) {
        // 优先用 dbId（数据库真实 id），兜底用 sub
        const realId = (token.dbId as string | undefined) ?? token.sub
        if (realId)         (session.user as { id?: string }).id = realId
        if (token?.role)    (session.user as { role?: string }).role = token.role as string
        if (token?.picture) session.user.image = token.picture as string
      }
      return session
    },
    async jwt({ token, user, account, trigger, session: updateSession }) {
      if (user) {
        // Credentials 登录：user.id 就是数据库真实 id
        token.sub  = user.id
        token.role = (user as { role?: string }).role ?? 'user'
        token.dbId = user.id   // 冗余存一份，避免 GitHub OAuth 覆盖
      }

      // GitHub OAuth 登录：token.sub 是 GitHub 平台 ID，需要用 email 查数据库拿真实 id
      if (account?.provider === 'github' && token.email && !token.dbId) {
        try {
          const dbUser = await getUserByEmail(token.email as string)
          if (dbUser) {
            token.dbId = String(dbUser.id)
            token.role = dbUser.role ?? 'admin'
          }
        } catch (e) {
          console.error('[jwt] GitHub 用户 db 查询失败', e)
        }
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
