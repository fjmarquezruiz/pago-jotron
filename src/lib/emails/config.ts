/** Cómo se conecta la tienda al servidor de correo. */
export interface MailConfig {
    host: string;
    port: number;
    /** TLS desde el primer byte (puerto 465). Con `false` se usa STARTTLS si el servidor lo ofrece. */
    secure: boolean;
    /** Sin usuario ni contraseña (Mailpit en local) no hay autenticación. */
    auth?: { user: string; pass: string };
    /** Remitente de todos los correos (`MAIL_FROM`). */
    from: string;
}

/**
 * Configuración del correo, leída del entorno: `SMTP_HOST`, `SMTP_PORT` (587 por defecto),
 * `SMTP_SECURE` (`true` para TLS directo), `SMTP_USER`/`SMTP_PASS` (opcionales) y `MAIL_FROM`.
 * En local es Mailpit (`localhost:1025`, sin credenciales); en producción, el SMTP real (A13).
 *
 * @returns La configuración, o `null` si falta `SMTP_HOST` o `MAIL_FROM` (no se envía nada).
 */
export function getMailConfig(): MailConfig | null {
    const host = process.env.SMTP_HOST?.trim();
    const from = process.env.MAIL_FROM?.trim();
    if (!host || !from) return null;
    const port = Number(process.env.SMTP_PORT?.trim() || 587);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    return {
        host,
        port,
        secure: process.env.SMTP_SECURE?.trim() === 'true',
        ...(user && pass ? { auth: { user, pass } } : {}),
        from,
    };
}
