import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/db/queries';
import { loginSchema } from '@/lib/validations/auth';

/** Configuración de NextAuth: login con email y contraseña y sesión JWT con el rol (RF1, RF2). */
export const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt' },
    providers: [
        CredentialsProvider({
            name: 'Email y contraseña',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Contraseña', type: 'password' },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;
                const { email, password } = parsed.data;

                // Buscar usuario por email
                const user = await getUserByEmail(email);
                if (!user || !user.isActive) return null;

                // Comparar contraseña
                const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
                if (!isPasswordValid) return null;

                // Devolver usuario
                return { id: String(user.id), email, name: user.name, role: user.role };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id;
            session.user.role = token.role;
            return session;
        },
    },
};
