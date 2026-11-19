import Stripe from 'stripe';

let client: Stripe | undefined;

/**
 * Cliente de Stripe del servidor, creado la primera vez que se pide y compartido después. La
 * clave secreta (`STRIPE_SECRET_KEY`, de prueba `sk_test_…` en desarrollo) se lee aquí y en
 * ningún otro sitio. Con `maxNetworkRetries` Stripe reintenta él solo los fallos de red sin
 * duplicar el cobro (usa claves de idempotencia internas) y el tiempo de espera es de 10 s.
 *
 * @returns El cliente de Stripe.
 * @throws {Error} Si falta `STRIPE_SECRET_KEY`.
 */
export function getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Falta la variable de entorno STRIPE_SECRET_KEY');
    client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 10_000 });
    return client;
}
