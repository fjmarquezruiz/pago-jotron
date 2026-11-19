import { NextResponse } from 'next/server';
import { getCartLines } from '@/lib/db/queries';
import { cartLinesRequestSchema } from '@/lib/validations/cart';

/**
 * Precio, stock y datos de las presentaciones del carrito (RF6). El carrito del cliente solo
 * guarda ids y cantidades; esta ruta da lo demás, siempre actual. Es pública: el invitado también
 * tiene carrito, y lo que devuelve es lo mismo que enseña el catálogo.
 *
 * Cuerpo: `{ variantIds: number[] }` (como mucho `CART_MAX_LINES`, los repetidos se juntan).
 * Respuestas: 200 `{ lines }` en el orden pedido, sin las presentaciones que ya no se pueden
 * comprar (bloqueadas o borradas) y con `stock: 0` las agotadas; 400 cuerpo no válido; 500 error
 * interno.
 */
export async function POST(request: Request) {
    const body = await request.json().catch(() => undefined);
    if (body === undefined)
        return NextResponse.json(
            { message: 'El cuerpo de la petición no es JSON válido' },
            { status: 400 },
        );

    const parsed = cartLinesRequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                message: 'Datos del carrito inválidos',
                errors: parsed.error.flatten().fieldErrors,
            },
            { status: 400 },
        );
    }

    try {
        const lines = await getCartLines(parsed.data.variantIds);
        // El stock y el precio cambian en cualquier momento: nada de guardar la respuesta.
        return NextResponse.json({ lines }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
