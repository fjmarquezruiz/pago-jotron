/**
 * Pantalla de error del panel (Figma: admin-error-404 y admin-error-500): la cabecera de la tienda
 * arriba y, centrados, el código en la fuente de titulares (140 px, al 20 % de opacidad), una línea
 * de 200 px, el título de 24 px, el texto de 16 px y los botones. No lleva el menú lateral.
 *
 * Es solo presentación (sin sesión ni hooks), así que la pueden usar `not-found.tsx` (servidor) y
 * `error.tsx` (cliente), cada una con su cabecera.
 *
 * @param props.header - Cabecera de la tienda (`SiteHeader` o `SiteHeaderView`).
 * @param props.code - `404`, `500`…
 * @param props.title - Título de la pantalla.
 * @param props.description - Explicación.
 * @param props.actions - Botones de salida.
 */
export function AdminErrorScreen({
    header,
    code,
    title,
    description,
    actions,
}: {
    header: React.ReactNode;
    code: string;
    title: string;
    description: string;
    actions: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            {header}
            <main className="flex flex-1 flex-col items-center gap-12 px-10 pt-40 pb-20">
                <p
                    aria-hidden="true"
                    className="font-display text-[140px] leading-[normal] font-bold tracking-[-0.04em] whitespace-nowrap text-foreground opacity-20 [text-box:trim-both_cap_alphabetic]"
                >
                    {code}
                </p>
                <div aria-hidden="true" className="h-px w-50 bg-muted-foreground" />
                <div className="flex w-full max-w-160 flex-col items-center gap-8 text-center">
                    <h1 className="w-full text-2xl font-normal">{title}</h1>
                    <p className="w-full text-base text-muted-foreground">{description}</p>
                </div>
                <div className="flex w-full items-center justify-center gap-3">{actions}</div>
            </main>
        </div>
    );
}
