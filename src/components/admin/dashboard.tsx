import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { activityAge, activityText, customerLabel } from '@/lib/admin/dashboard';
import type {
    CatalogStats,
    OrderStats,
    RecentActivity,
    RecentOrder,
    TopSellingWine,
} from '@/lib/db/admin-dashboard';
import { formatShortDate } from '@/lib/orders/dates';
import { orderNumber } from '@/lib/orders/format';
import type { OrderStatus } from '@/lib/orders/status';
import { formatEuros } from '@/lib/utils';

/** Lo que enseña el panel de control. Sin `orders`, es la variante del editor (solo catálogo). */
export interface DashboardData {
    catalog: CatalogStats;
    topSelling: TopSellingWine[];
    /** Pedidos y registro de actividad: solo el administrador (el editor no puede abrirlos). */
    orders?: { stats: OrderStats; recent: RecentOrder[]; activity: RecentActivity[] };
}

const NUMBER = new Intl.NumberFormat('es-ES');

/** Tarjeta del panel (Figma: Frame / TopSellingCard / QuickActionsCard): borde, radio 4 y 24 px de relleno. */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <section
            className={`flex flex-col items-stretch gap-5 rounded-sm border border-border p-6 ${className ?? ''}`}
        >
            {children}
        </section>
    );
}

/** Título de una tarjeta y, a la derecha, su enlace «Ver todos». */
function CardHeader({
    title,
    href,
    linkLabel,
}: {
    title: string;
    href: string;
    linkLabel: string;
}) {
    return (
        <div className="grid grid-cols-2 items-center gap-gap-md">
            <h2 className="text-base font-medium whitespace-nowrap">{title}</h2>
            <Button asChild variant="ghost" size="xs" className="justify-self-end">
                <Link href={href}>
                    {linkLabel}
                    <ArrowRight className="size-3.5" />
                </Link>
            </Button>
        </div>
    );
}

function plural(n: number, one: string, many: string): string {
    return `${NUMBER.format(n)} ${n === 1 ? one : many}`;
}

/** Las cifras de arriba, en el orden de Figma. Pedidos activos e ingresos solo salen con `orders`. */
function StatCards({ catalog, stats }: { catalog: CatalogStats; stats?: OrderStats }) {
    const low = catalog.lowStockProducts;
    const span = 'col-span-12 sm:col-span-6 lg:col-span-3';
    return (
        <>
            <MetricCard
                variant="admin"
                className={span}
                label="Total de vinos"
                value={NUMBER.format(catalog.totalProducts)}
            />
            {stats && (
                <>
                    <MetricCard
                        variant="admin"
                        className={span}
                        label="Pedidos activos"
                        value={NUMBER.format(stats.activeOrders)}
                        caption={`${plural(stats.pendingShipment, 'pendiente', 'pendientes')} de envío`}
                    />
                    <MetricCard
                        variant="admin"
                        className={span}
                        label="Ingresos del mes hasta la fecha"
                        value={formatEuros(stats.monthRevenue)}
                    />
                </>
            )}
            <MetricCard
                variant="admin"
                className={span}
                label="Alertas de existencias bajas"
                value={NUMBER.format(low)}
                trend={low > 0 ? 'vinos por debajo del umbral' : undefined}
                trendDirection="down"
                caption={low > 0 ? undefined : 'ningún vino por debajo del umbral'}
            />
        </>
    );
}

function RecentOrdersCard({ rows }: { rows: RecentOrder[] }) {
    return (
        <Card className="col-span-12 lg:col-span-8">
            <CardHeader
                title="Pedidos recientes"
                href="/admin/pedidos"
                linkLabel="Ver todos los pedidos"
            />
            <Table size="xs">
                <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="w-27.5">ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead align="right">Total</TableHead>
                        <TableHead align="center">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableEmpty colSpan={5}>
                            <p className="text-xs text-muted-foreground">Todavía no hay pedidos.</p>
                        </TableEmpty>
                    ) : (
                        rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{orderNumber(row.id)}</TableCell>
                                <TableCell>
                                    {customerLabel(
                                        row.customerName,
                                        row.customerLastName,
                                        row.customerEmail,
                                    )}
                                </TableCell>
                                <TableCell>{formatShortDate(row.createdAt)}</TableCell>
                                <TableCell align="right">{formatEuros(row.total)}</TableCell>
                                <TableCell align="center">
                                    <OrderStatusBadge
                                        status={row.status as OrderStatus}
                                        variant="subtle"
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

function TopSellingCard({ wines, className }: { wines: TopSellingWine[]; className?: string }) {
    return (
        <Card className={className}>
            <h2 className="text-base font-medium">Vinos más vendidos</h2>
            {wines.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                    Aún no hay ventas en los últimos 30 días.
                </p>
            ) : (
                <ol className="flex flex-col gap-3">
                    {wines.map((wine, i) => (
                        <li
                            key={wine.productId}
                            className="flex items-center gap-3 rounded-sm bg-muted px-3 py-2"
                        >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {i + 1}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs">
                                <p className="truncate font-medium">{wine.name}</p>
                                <p className="text-muted-foreground">
                                    {plural(wine.units, 'unidad', 'unidades')}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </Card>
    );
}

function QuickActionsCard({ isAdmin, className }: { isAdmin: boolean; className?: string }) {
    return (
        <Card className={className}>
            <h2 className="text-base font-medium">Acciones rápidas</h2>
            <div className="flex flex-col gap-3">
                <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/admin/productos/nuevo">Añadir vino</Link>
                </Button>
                {isAdmin && (
                    <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/admin/pedidos">Tramitar pedidos</Link>
                    </Button>
                )}
            </div>
        </Card>
    );
}

function RecentActivityCard({ rows, now }: { rows: RecentActivity[]; now: Date }) {
    return (
        <Card className="col-span-12 lg:col-span-9">
            <CardHeader
                title="Actividad reciente"
                href="/admin/auditoria"
                linkLabel="Ver registro"
            />
            <Table size="xs">
                <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="w-41">Fecha</TableHead>
                        <TableHead>Actividad</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableEmpty colSpan={2}>
                            <p className="text-xs text-muted-foreground">
                                Todavía no hay actividad registrada.
                            </p>
                        </TableEmpty>
                    ) : (
                        rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="whitespace-nowrap">
                                    {activityAge(row.loggedAt, now)}
                                </TableCell>
                                <TableCell className="max-w-0 truncate">
                                    {activityText(row.action, row.details)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

/**
 * Cuerpo del panel de control (Figma: admin-dashboard y admin-dashboard - editor): cifras, pedidos
 * recientes, vinos más vendidos, acciones rápidas y actividad reciente, en una rejilla de 12
 * columnas con 16 px de separación.
 *
 * El administrador ve todo. El editor, solo lo de catálogo (total de vinos, existencias bajas,
 * vinos más vendidos y «Añadir vino»): no puede abrir ni los pedidos ni el registro, así que no se
 * le enseñan sus datos. Sin «+12 % respecto al mes pasado» (pide comparar periodos) ni «Ver
 * informes» (no existe esa pantalla). La columna Tipo de la actividad llega con el registro.
 *
 * @param props.isAdmin - `true` para el administrador.
 * @param props.data - Datos ya leídos; `data.orders` solo se pasa al administrador.
 * @param props.now - Ahora, para «Hace 10 minutos».
 */
export function AdminDashboard({
    isAdmin,
    data,
    now,
}: {
    isAdmin: boolean;
    data: DashboardData;
    now: Date;
}) {
    const orders = isAdmin ? data.orders : undefined;
    return (
        <div className="grid grid-cols-12 gap-gap-md">
            <StatCards catalog={data.catalog} stats={orders?.stats} />
            {orders && <RecentOrdersCard rows={orders.recent} />}
            <TopSellingCard
                wines={data.topSelling}
                // Sin la fila de pedidos (editor), empieza fila nueva bajo las cifras.
                className={`col-span-12 self-start lg:col-span-4 ${orders ? '' : 'lg:col-start-1'}`}
            />
            <QuickActionsCard isAdmin={isAdmin} className="col-span-12 self-start lg:col-span-3" />
            {orders && <RecentActivityCard rows={orders.activity} now={now} />}
        </div>
    );
}
