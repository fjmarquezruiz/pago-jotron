import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { auditDotClass, auditKind } from '@/lib/admin/audit';
import { activityText } from '@/lib/admin/dashboard';
import type { AdminAuditPage } from '@/lib/db/admin-audit';
import { formatStepDate } from '@/lib/orders/dates';

/** Punto de color del tipo (Figma: círculo de 8 px en una celda de 16 px). Decorativo: el tipo va en su etiqueta. */
function KindDot({ kind }: { kind: ReturnType<typeof auditKind> }) {
    return (
        <span aria-hidden="true" className={`block size-2 rounded-full ${auditDotClass(kind)}`} />
    );
}

/**
 * Tabla del registro de actividad (Figma: activity-table): un punto de color, la fecha (`15 oct,
 * 10:32`), la actividad (la acción guardada y su detalle, sin reescribir) y el tipo, con las
 * columnas de 64 / 180 / resto / 200 px. Solo lectura. En pantallas pequeñas cada asiento es una
 * fila de lista.
 *
 * @param props.rows - Los asientos de la página (`getAdminAuditPage`).
 */
export function AdminAuditTable({ rows }: { rows: AdminAuditPage['items'] }) {
    return (
        <>
            <ul className="flex flex-col rounded-sm border md:hidden">
                {rows.map((row) => {
                    const kind = auditKind(row.action);
                    return (
                        <li
                            key={row.id}
                            className="flex flex-col gap-gap-xs border-b p-inset-md text-xs last:border-b-0"
                        >
                            <span className="flex items-center justify-between gap-gap-sm">
                                <span className="flex items-center gap-gap-xs text-muted-foreground">
                                    <KindDot kind={kind} />
                                    {formatStepDate(row.loggedAt)}
                                </span>
                                <Badge variant="outline" tone="neutral">
                                    {kind}
                                </Badge>
                            </span>
                            <span>{activityText(row.action, row.details)}</span>
                        </li>
                    );
                })}
            </ul>
            <div className="hidden md:block">
                <Table size="xs" className="table-fixed">
                    <colgroup>
                        <col className="w-16" />
                        <col className="w-45" />
                        <col />
                        <col className="w-50" />
                    </colgroup>
                    <TableHeader>
                        <TableRow className="bg-transparent hover:bg-transparent">
                            <TableHead>
                                <span className="sr-only">Color</span>
                            </TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Actividad</TableHead>
                            <TableHead align="center">Tipo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => {
                            const kind = auditKind(row.action);
                            const text = activityText(row.action, row.details);
                            return (
                                <TableRow key={row.id}>
                                    <TableCell className="px-inset-md">
                                        <KindDot kind={kind} />
                                    </TableCell>
                                    <TableCell>{formatStepDate(row.loggedAt)}</TableCell>
                                    <TableCell className="truncate" title={text}>
                                        {text}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Badge variant="outline" tone="neutral">
                                            {kind}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
