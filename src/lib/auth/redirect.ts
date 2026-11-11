/**
 * Devuelve una ruta interna segura a la que redirigir tras el login. Evita el open redirect.
 * @param value Valor de callbackUrl de la URL.
 * @returns La ruta si es interna, o '/' en cualquier otro caso.
 */
export function safeCallbackUrl(value: string | string[] | undefined): string {
    if (
        typeof value !== 'string' ||
        !value.startsWith('/') ||
        value.startsWith('//') ||
        value.startsWith('/\\')
    ) {
        return '/';
    }
    return value;
}
