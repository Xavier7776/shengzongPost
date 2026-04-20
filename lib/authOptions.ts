// lib/authOptions.ts
import GitHub from 'next-auth/providers/github'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const githubProfile = profile as { login?: string }
      return githubProfile?.login === process.env.ADMIN_GITHUB_USERNAME
    },
    async session({ session, token }) {
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
}
