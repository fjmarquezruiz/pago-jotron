'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CartLine } from '@/lib/db/queries';

export type CartLinesStatus = 'loading' | 'ready' | 'error';

/**
 * Carga de `POST /api/carrito/lineas` el precio, el stock y los datos de las presentaciones del
 * carrito, que el almacén no guarda.
 *
 * Pide solo cuando hace falta: al abrir y cuando aparece un id que aún no se ha cargado (por
 * ejemplo, desde otra pestaña). Quitar una línea no vuelve a pedir nada. Con el carrito vacío no
 * pide.
 *
 * `onLoaded` se llama con cada respuesta, justo antes de que se vea: ahí se pone el carrito al día
 * (`reconcileCart`) para que nunca se pinte una línea agotada.
 *
 * @param variantIds - Ids de las presentaciones del carrito, en orden.
 * @param onLoaded - Recibe las líneas que acaban de llegar.
 * @returns Las últimas líneas cargadas, el estado de la carga y `retry` para repetir tras un error.
 *
 * @example
 * const { lines, status, retry } = useCartLines(items.map((item) => item.variantId), reconcile);
 */
export function useCartLines(variantIds: readonly number[], onLoaded: (lines: CartLine[]) => void) {
    const [lines, setLines] = useState<CartLine[]>([]);
    const [status, setStatus] = useState<CartLinesStatus>('loading');
    const [attempt, setAttempt] = useState(0);

    // Las líneas ya cargadas, sin que el efecto dependa de ellas: solo debe repetirse si cambian los
    // ids. Se actualiza antes de `onLoaded`, que puede quitar líneas del carrito y cambiar los ids.
    const loaded = useRef<CartLine[]>([]);
    const onLoadedRef = useRef(onLoaded);
    onLoadedRef.current = onLoaded;

    const key = variantIds.join(',');
    useEffect(() => {
        const ids = key === '' ? [] : key.split(',').map(Number);
        if (ids.length === 0) return;
        if (ids.every((id) => loaded.current.some((line) => line.variantId === id))) {
            // Ya está todo cargado: nada que pedir. Pero un efecto anterior pudo dejar el estado en
            // 'loading' o 'error' y haber abortado su petición al cambiar los ids.
            setStatus('ready');
            return;
        }

        const controller = new AbortController();
        setStatus('loading');
        fetch('/api/carrito/lineas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variantIds: ids }),
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json() as Promise<{ lines: CartLine[] }>;
            })
            .then((body) => {
                loaded.current = body.lines;
                onLoadedRef.current(body.lines);
                setLines(body.lines);
                setStatus('ready');
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setStatus('error');
            });

        return () => controller.abort();
    }, [key, attempt]);

    const retry = useCallback(() => setAttempt((current) => current + 1), []);
    return { lines, status, retry };
}
