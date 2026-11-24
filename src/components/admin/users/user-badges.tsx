import { Badge } from '@/components/ui/badge';
import type { Role } from '@/types/auth';

/**
 * Etiqueta del rol de una cuenta (Figma: Rol de users-list): Cliente en contorno neutro, Editor en
 * contorno de marca y Administrador relleno de marca.
 *
 * @param props.role - `users.role`.
 */
export function UserRoleBadge({ role }: { role: Role }) {
    if (role === 'Administrador')
        return (
            <Badge tone="brand" variant="solid">
                {role}
            </Badge>
        );
    return (
        <Badge tone={role === 'Editor' ? 'brand' : 'neutral'} variant="outline">
            {role}
        </Badge>
    );
}

/**
 * Etiqueta del estado de una cuenta (Figma: Estado de users-list): Activo en verde suave e Inactivo
 * en neutro suave.
 *
 * @param props.isActive - `users.is_active`.
 */
export function UserStatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <Badge tone={isActive ? 'success' : 'neutral'} variant="subtle">
            {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
    );
}
