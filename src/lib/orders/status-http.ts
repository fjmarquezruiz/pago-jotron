import type { ChangeStatusFailureCode } from './change-status';

/** Código HTTP de cada motivo por el que no se pudo cambiar el estado de un pedido. */
export const CHANGE_STATUS_HTTP: Record<ChangeStatusFailureCode, number> = {
    not_found: 404,
    forbidden: 403,
    invalid_transition: 409,
    cancel_window_closed: 409,
    invalid_cancellation_type: 400,
    conflict: 409,
};
