import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import jwt from 'jsonwebtoken'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async session({ session, user }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET
      if (signingSecret) {
        const payload = {
          aud: 'authenticated',
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user.id,
          email: user.email,
          role: 'authenticated',
        }
        session.supabaseAccessToken = jwt.sign(payload, signingSecret)
      }
      session.user.id = user.id
      return session
    },
  },
})

declare module 'next-auth' {
  interface Session {
    supabaseAccessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
