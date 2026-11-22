import { getBlockCandidateIds } from '@/lib/db/queries';
import { blockOrder } from './block';
import { BLOCK_AFTER_DAYS } from './status';

/** Resultado de una pasada del bloqueo automático. */
export interface BlockOverdueSummary {
    /** Pedidos preseleccionados. */
    checked: number;
    /** Pedidos que han quedado Bloqueados. */
    blocked: number;
    /** Los que ya no cumplían (se movieron entre medias): no es un error. */
    skipped: number;
    /** Ids de los que fallaron con un error inesperado; se reintentan en la pasada siguiente. */
    failed: number[];
}

/** Un `Date` como `datetime` UTC de MySQL (`AAAA-MM-DD HH:MM:SS`). */
const toDbDate = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

/**
 * Bloquea todos los pedidos que llevan más de 15 días en el mismo estado (RF8): lo que ejecuta el
 * cron diario. Lista los candidatos y llama a `blockOrder` con cada uno, que es quien aplica
 * `shouldBlock` de verdad. Un pedido que falla no frena a los demás.
 *
 * @param now - Reloj, para poder probar el plazo.
 * @returns El recuento de la pasada.
 */
export async function blockOverdueOrders(now: Date = new Date()): Promise<BlockOverdueSummary> {
    const cutoff = new Date(now.getTime() - BLOCK_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const ids = await getBlockCandidateIds(toDbDate(cutoff));
    const summary: BlockOverdueSummary = {
        checked: ids.length,
        blocked: 0,
        skipped: 0,
        failed: [],
    };
    for (const id of ids) {
        try {
            const result = await blockOrder(id, now);
            if (result.ok) summary.blocked++;
            else summary.skipped++;
        } catch (error) {
            console.error(`[cron] No se pudo bloquear el pedido ${id}`, error);
            summary.failed.push(id);
        }
    }
    return summary;
}
