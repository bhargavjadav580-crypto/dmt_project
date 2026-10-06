import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

// Rate limiting & lockout tracking
const loginAttempts = new Map<string, { count: number; timestamp: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;
        
        // Rate limiting check
        const attempt = loginAttempts.get(email);
        if (attempt) {
          if (attempt.count >= MAX_ATTEMPTS && Date.now() - attempt.timestamp < LOCKOUT_MS) {
            throw new Error('Account temporarily locked due to too many failed attempts. Please try again later.');
          }
          if (Date.now() - attempt.timestamp >= LOCKOUT_MS) {
            loginAttempts.delete(email);
          }
        }

        // Query real user from database
        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) {
          recordFailedAttempt(email);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
          recordFailedAttempt(email);
          return null;
        }

        // Reset failed attempts
        loginAttempts.delete(email);

        // Update last login timestamp
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          language: user.language || 'en',
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role as string;
        token.departmentId = (user as any).departmentId as string | null;
        token.language = ((user as any).language || 'en') as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string | null;
        session.user.language = token.language as string;
      }
      return session;
    }
  }
});

function recordFailedAttempt(email: string) {
  const attempt = loginAttempts.get(email);
  if (attempt) {
    attempt.count += 1;
    attempt.timestamp = Date.now();
  } else {
    loginAttempts.set(email, { count: 1, timestamp: Date.now() });
  }
}
