import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/** Endpoints de NextAuth (login, logout, sesión, CSRF) para el App Router. */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
