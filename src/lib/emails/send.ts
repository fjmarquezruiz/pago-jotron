import nodemailer from 'nodemailer';
import { getMailConfig } from './config';

/** Un correo listo para enviar. */
export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    /** Versión en texto plano, para los clientes que no pintan HTML. */
    text: string;
}

/**
 * Envía un correo por SMTP. NUNCA lanza: un correo que falla no debe deshacer ni frenar lo que lo
 * originó (un pedido ya cobrado, una anulación ya hecha). Si no hay configuración o el servidor
 * falla, el error va al log y se devuelve `false`.
 *
 * @param message - Destinatario, asunto y cuerpo.
 * @returns `true` si el servidor aceptó el correo.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
    try {
        const config = getMailConfig();
        if (config === null) {
            console.error(
                `[correo] No se envía «${message.subject}»: faltan SMTP_HOST o MAIL_FROM en el entorno`,
            );
            return false;
        }
        const { from, ...smtp } = config;
        // Con plazos cortos: un SMTP caído no debe retener la respuesta al cliente minutos.
        await nodemailer
            .createTransport({ ...smtp, connectionTimeout: 10_000, socketTimeout: 15_000 })
            .sendMail({ from, ...message });
        return true;
    } catch (error) {
        console.error(`[correo] No se pudo enviar «${message.subject}»`, error);
        return false;
    }
}
