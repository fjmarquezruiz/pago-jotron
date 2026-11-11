import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkAccess } from '@/lib/auth/access';

/** Protege las páginas según la sesión y el rol (RF1, RNF3). Las API comprueban el rol por su cuenta. */
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const result = checkAccess(pathname, token?.role ?? null);
    const isApi = pathname.startsWith('/api/');

    if (result === 'login') {
        if (isApi)
            return NextResponse.json({ message: 'Inicia sesión para continuar' }, { status: 401 });

        const callbackUrl = pathname + req.nextUrl.search;
        return NextResponse.redirect(
            new URL(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl),
        );
    }
    if (result === 'denied') {
        if (isApi)
            return NextResponse.json(
                { message: 'No tienes permiso para esta acción' },
                { status: 403 },
            );

        return NextResponse.redirect(new URL('/acceso-denegado', req.nextUrl));
    }
    return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'] };
