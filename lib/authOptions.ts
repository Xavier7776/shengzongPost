// lib/authOptions.ts
import GitHub from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import bcrypt from 'bcryptjs'
import { passwordSessionStamp } from '@/lib/security/verification-token'
import { safePostImageUrl } from '@/shared/markdown/sanitize'
import { logFailure } from '@/lib/security/log'
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
          logFailure('lib/authOptions.ts', error)
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
        return Boolean(process.env.ADMIN_GITHUB_USERNAME && githubProfile?.login === process.env.ADMIN_GITHUB_USERNAME)
      }
      return true
    },
    async session({ session, token }) {
      if (!token.dbId) { session.user = undefined; return session }
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
      try {
        // OAuth provider IDs must never be treated as database account IDs.
        let dbUser = null
        if (account?.provider === 'github') {
          dbUser = token.email ? await getUserByEmail(token.email) : null
          if (!dbUser || dbUser.role !== 'admin') return {}
          token.dbId = String(dbUser.id)
          token.sub = String(dbUser.id)
        } else if (user) {
          token.dbId = user.id
          token.sub = user.id
        }
        const id = Number(token.dbId ?? token.sub)
        if (!Number.isSafeInteger(id) || id <= 0) return {}
        dbUser ??= await getUserById(id)
        if (!dbUser || normalizeEmail(token.email) !== normalizeEmail(dbUser.email)) return {}
        if (token.passwordStamp && token.passwordStamp !== passwordSessionStamp(id, dbUser.password)) return {}
        token.dbId = String(dbUser.id)
        token.role = dbUser.role
        // Legacy JWTs have no password version; avoid silently invalidating all existing sessions.
        if ((user || account) && dbUser.password) token.passwordStamp = passwordSessionStamp(id, dbUser.password)
        if (trigger === 'update' && updateSession) {
          if (typeof updateSession.name === 'string' && updateSession.name.length <= 60) token.name = updateSession.name
          if (typeof updateSession.image === 'string') {
            const image = safePostImageUrl(updateSession.image)
            if (image) token.picture = image
          }
        }
        return token
      } catch (error) {
        logFailure('session-validation', error)
        return {}
      }
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
}
