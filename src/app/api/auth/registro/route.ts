import { getUserByEmail, createUser } from '@/lib/db/queries';
import { registerSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

/** Registra una cuenta de cliente mayor de edad (RF2). 201 creada, 400 datos no válidos, 409 email ya registrado. */
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        if (!body)
            return NextResponse.json(
                { message: 'El cuerpo de la petición no es JSON válido' },
                { status: 400 },
            );

        const user = registerSchema.safeParse(body);

        if (!user.success) {
            return NextResponse.json(
                {
                    message: 'Datos de registro inválidos',
                    errors: user.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { email, password, birthDate } = user.data;

        if (await getUserByEmail(email)) {
            return NextResponse.json(
                { message: 'Ya existe una cuenta con ese correo' },
                { status: 409 },
            );
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const id = await createUser({ email, passwordHash, birthDate });
        return NextResponse.json({ message: 'Cuenta creada', id }, { status: 201 });
    } catch (error) {
        const code =
            (error as { code?: string; cause?: { code?: string } }).code ??
            (error as { cause?: { code?: string } }).cause?.code;
        if (code === 'ER_DUP_ENTRY')
            return NextResponse.json(
                { message: 'Ya existe una cuenta con ese correo' },
                { status: 409 },
            );
        console.error(error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
