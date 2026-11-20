import type { StateStorage } from 'zustand/middleware';

/**
 * `localStorage` o `sessionStorage` que nunca lanza. Sin él, `persist` se queda sin `store.persist`
 * si leer el almacenamiento falla (en el servidor no existe; en un navegador con los datos del
 * sitio bloqueados lanza `SecurityError`), y una escritura sin espacio rompería la acción que la
 * provoca. Si no se puede guardar, el almacén sigue funcionando en memoria.
 *
 * @param area - `'local'` (`localStorage`, dura entre visitas) o `'session'` (`sessionStorage`,
 *   solo esta pestaña).
 * @returns Un `StateStorage` para `createJSONStorage`.
 *
 * @example
 * createJSONStorage(() => withValidJson(browserStorage('session')));
 */
export function browserStorage(area: 'local' | 'session'): StateStorage {
    // Se resuelve en cada uso: acceder a `window.localStorage` ya puede lanzar.
    const pick = () => (area === 'local' ? localStorage : sessionStorage);
    return {
        getItem: (name) => {
            try {
                return pick().getItem(name);
            } catch {
                return null;
            }
        },
        setItem: (name, value) => {
            try {
                pick().setItem(name, value);
            } catch {
                // Bloqueado o sin espacio: no se guarda, y el almacén sigue en memoria.
            }
        },
        removeItem: (name) => {
            try {
                pick().removeItem(name);
            } catch {
                // Igual que en `setItem`.
            }
        },
    };
}

/**
 * Envuelve un almacenamiento para que `getItem` devuelva `null` si lo guardado no es JSON. Sin
 * esto, `JSON.parse` lanza dentro de `persist` y la recuperación termina en su `catch`, que ni
 * marca el almacén como recuperado (`hasHydrated`) ni avisa a quien espera: la página se quedaría
 * para siempre en el esqueleto.
 *
 * @param storage - El almacenamiento a envolver.
 * @returns Uno que trata lo que no es JSON como "no hay nada guardado".
 *
 * @example
 * createJSONStorage(() => withValidJson(browserStorage('local')));
 */
export function withValidJson(storage: StateStorage): StateStorage {
    const valid = (raw: string | null): string | null => {
        if (raw === null) return null;
        try {
            JSON.parse(raw);
            return raw;
        } catch {
            return null;
        }
    };
    return {
        getItem: (name) => {
            const value = storage.getItem(name);
            return typeof value === 'string' || value === null
                ? valid(value)
                : Promise.resolve(value).then(valid);
        },
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
    };
}
