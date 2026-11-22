import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { blockOverdueOrders } from '@/lib/orders/block-overdue';

// Es una tarea, no una página: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Compara en tiempo constante, para no filtrar el secreto por el tiempo de respuesta. */
function sameSecret(received: string, expected: string): boolean {
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Cron diario (RF8): bloquea los pedidos que llevan más de 15 días en el mismo estado. Lo lanza
 * Vercel según `vercel.json`, que manda `Authorization: Bearer ${CRON_SECRET}` si esa variable
 * existe en el proyecto. La ruta no tiene sesión (el middleware la deja pasar) y se protege solo con
 * ese secreto; sin `CRON_SECRET` configurado no atiende a nadie.
 *
 * Respuestas: 200 `{ checked, blocked, skipped, failed }`; 401 secreto ausente o incorrecto; 500
 * falta `CRON_SECRET` o error de la BD. Si algún pedido falla se responde 200 igualmente, con sus
 * ids en `failed` (y en el log): se reintentan solos al día siguiente.
 */
export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
        console.error('[cron] Falta CRON_SECRET: no se bloquea nada');
        return NextResponse.json({ message: 'Cron sin configurar' }, { status: 500 });
    }
    const header = request.headers.get('authorization') ?? '';
    if (!header.startsWith('Bearer ') || !sameSecret(header.slice(7), secret))
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    try {
        return NextResponse.json(await blockOverdueOrders(), {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        console.error('[cron] Fallo al bloquear pedidos', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
