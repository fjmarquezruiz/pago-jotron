import { Alert } from '@/components/ui/alert';

interface CartNoticesProps {
    /** Qué se ha cambiado en el carrito y por qué (`describeChanges`). */
    messages: readonly string[];
    onClose: () => void;
}

/**
 * Aviso de que el carrito ha cambiado al cargarlo: lo que se ha agotado y se ha quitado, lo que ya
 * no está a la venta y las cantidades que se han ajustado al stock. Sin él, una línea desaparecería
 * sin que el cliente supiera por qué. No sale en el diseño de Figma. Se puede cerrar.
 *
 * @example
 * <CartNotices messages={['«Tinto Roble» (Botella 75 cl) se ha agotado y lo hemos quitado de tu carrito.']} onClose={clear} />
 */
export function CartNotices({ messages, onClose }: CartNoticesProps) {
    return (
        <Alert type="warning" title="Hemos actualizado tu carrito" onClose={onClose}>
            <ul className="flex flex-col gap-1">
                {messages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        </Alert>
    );
}
