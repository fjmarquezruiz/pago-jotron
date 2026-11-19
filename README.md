This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Pruebas

- `pnpm test`: pruebas unitarias (Vitest), junto al código.
- `pnpm test:e2e`: pruebas de extremo a extremo (Playwright, en `e2e/`). Usan el navegador, la app y la
  BD de verdad, así que necesitan MySQL arrancado y sembrado (`pnpm db:seed`). Reutilizan el
  servidor de `http://localhost:3000` si ya está en marcha (`E2E_BASE_URL` lo cambia) y, si no,
  arrancan `pnpm dev`. En local usan el Chrome del sistema. Tocan solo el carrito del cliente
  `user@jotron.com` y lo vacían antes y después.
- E2E del checkout (`e2e/checkout.spec.ts`): compran de verdad en modo prueba, así que necesitan las
  claves de PRUEBA de Stripe en `.env.local` (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
  y la BD sembrada. La prueba de la transferencia necesita que el servidor tenga `BANK_TRANSFER_HOLDER`
  y `BANK_TRANSFER_IBAN` (si no, se salta). Cada prueba reembolsa el cobro, borra el pedido y la
  dirección que crea y devuelve el stock y el perfil de `user@jotron.com`. Si el `pnpm dev` de siempre
  ya está ocupado, arranca otro servidor (`BANK_TRANSFER_HOLDER=… BANK_TRANSFER_IBAN=…
NEXTAUTH_URL=http://localhost:3100 pnpm exec next dev -p 3100`) y lanza
  `E2E_BASE_URL=http://localhost:3100 pnpm test:e2e`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
