import { NextResponse } from 'next/server';
import { AGE_VERIFIED_COOKIE, AGE_VERIFIED_MAX_AGE, isAdult } from '@/lib/auth/age';
import { ageGateSchema } from '@/lib/validations/auth';

/**
 * Verifica la mayoría de edad en el servidor (RNF3). 200 con la cookie `age_verified`, 400 datos
 * no válidos, 403 menor de edad. La fecha no se guarda: solo queda la marca de que se verificó (RGPD).
 */
export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body)
        return NextResponse.json(
            { message: 'El cuerpo de la petición no es JSON válido' },
            { status: 400 },
        );

    const parsed = ageGateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                message: 'Datos de verificación inválidos',
                errors: parsed.error.flatten().fieldErrors,
            },
            { status: 400 },
        );
    }

    if (!isAdult(parsed.data.birthDate)) {
        return NextResponse.json(
            { message: 'Tienes que ser mayor de edad (18 años o más)' },
            { status: 403 },
        );
    }

    const response = NextResponse.json({ message: 'Edad verificada' });
    response.cookies.set(AGE_VERIFIED_COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: AGE_VERIFIED_MAX_AGE,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
    });
    return response;
}
