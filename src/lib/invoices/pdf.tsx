import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatCents } from '@/lib/cart/totals';
import { formatShortDate } from '@/lib/orders/dates';
import type { InvoiceDocument } from './types';

/**
 * Colores y medidas del PDF. Son propios del documento (no hay Tailwind ni tokens dentro de un PDF)
 * y se mantienen sobrios: la factura es un papel, no una pantalla de la tienda.
 */
const INK = '#0a0a0a';
const MUTED = '#525252';
const LINE = '#d4d4d4';
const HEAD = '#f5f5f5';

const styles = StyleSheet.create({
    // Helvetica es una fuente estándar del PDF: no hay que incrustar nada y cubre tildes, ñ y €.
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: INK, lineHeight: 1.35 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    title: { fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 8 },
    meta: { color: MUTED },
    metaStrong: { fontFamily: 'Helvetica-Bold', color: INK },
    parties: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    party: { flex: 1 },
    label: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: MUTED, marginBottom: 4 },
    strong: { fontFamily: 'Helvetica-Bold' },
    table: { borderTopWidth: 1, borderTopColor: LINE, marginBottom: 20 },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE },
    head: { backgroundColor: HEAD },
    cell: { paddingVertical: 5, paddingHorizontal: 6 },
    headText: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
    right: { textAlign: 'right' },
    section: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 6 },
    totalBox: {
        alignSelf: 'flex-end',
        minWidth: 190,
        marginTop: 4,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: HEAD,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    totalText: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
    note: { marginTop: 16, color: MUTED, fontSize: 8 },
});

/** Anchos de las columnas de la tabla de líneas (el resto es la descripción). */
const COL = { qty: 38, unit: 72, vat: 40, total: 72 } as const;

/** Tipo de IVA en % para el lector: `'21.00'` → `21 %`, `'4.50'` → `4,5 %`. */
function formatRate(rate: string): string {
    return `${Number(rate).toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`;
}

/** Título del documento según su tipo (Real Decreto 1619/2012: completa o simplificada). */
export function invoiceTitle(kind: InvoiceDocument['kind']): string {
    return kind === 'Simplificada' ? 'Factura simplificada' : 'Factura';
}

/**
 * La factura de un pedido entregado (Real Decreto 1619/2012): número y fecha de expedición, emisor,
 * destinatario con lo que haya (en la simplificada no se inventa nada), pedido, líneas con su IVA,
 * envío, desglose de base y cuota por tipo y total. Sale solo de `document`, congelado al emitirla.
 * La fecha de la operación coincide con la de expedición (se emite al entregar), así que no se repite.
 *
 * @param props.document - La factura tal como se guardó al emitirla, con el emisor que tenía entonces.
 */
export function InvoicePdf({ document }: { document: InvoiceDocument }) {
    const { issuer, recipient, lines, shipping, vat } = document;
    const hasRecipient = Boolean(recipient.name || recipient.taxId || recipient.address);

    return (
        <Document title={`${invoiceTitle(document.kind)} ${document.number}`} author={issuer.name}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{invoiceTitle(document.kind)}</Text>
                        <Text style={styles.meta}>
                            Número: <Text style={styles.metaStrong}>{document.number}</Text>
                        </Text>
                        <Text style={styles.meta}>
                            Fecha de expedición:{' '}
                            <Text style={styles.metaStrong}>
                                {formatShortDate(document.issueDate)}
                            </Text>
                        </Text>
                        <Text style={styles.meta}>
                            Pedido: <Text style={styles.metaStrong}>{document.orderNumber}</Text>
                        </Text>
                    </View>
                </View>

                <View style={styles.parties}>
                    <View style={styles.party}>
                        <Text style={styles.label}>EMISOR</Text>
                        <Text style={styles.strong}>{issuer.name}</Text>
                        <Text>NIF: {issuer.taxId}</Text>
                        <Text>{issuer.address}</Text>
                    </View>
                    {hasRecipient && (
                        <View style={styles.party}>
                            <Text style={styles.label}>DESTINATARIO</Text>
                            {recipient.name ? (
                                <Text style={styles.strong}>{recipient.name}</Text>
                            ) : null}
                            {recipient.taxId ? <Text>NIF: {recipient.taxId}</Text> : null}
                            {recipient.address ? <Text>{recipient.address}</Text> : null}
                        </View>
                    )}
                </View>

                <View style={styles.table}>
                    <View style={[styles.row, styles.head]}>
                        <Text style={[styles.cell, styles.headText, { flex: 1 }]}>Descripción</Text>
                        <Text
                            style={[styles.cell, styles.headText, styles.right, { width: COL.qty }]}
                        >
                            Cant.
                        </Text>
                        <Text
                            style={[
                                styles.cell,
                                styles.headText,
                                styles.right,
                                { width: COL.unit },
                            ]}
                        >
                            Precio ud.
                        </Text>
                        <Text
                            style={[styles.cell, styles.headText, styles.right, { width: COL.vat }]}
                        >
                            IVA
                        </Text>
                        <Text
                            style={[
                                styles.cell,
                                styles.headText,
                                styles.right,
                                { width: COL.total },
                            ]}
                        >
                            Importe
                        </Text>
                    </View>
                    {lines.map((line, index) => (
                        <View key={`${index}-${line.description}`} style={styles.row} wrap={false}>
                            <Text style={[styles.cell, { flex: 1 }]}>{line.description}</Text>
                            <Text style={[styles.cell, styles.right, { width: COL.qty }]}>
                                {line.quantity}
                            </Text>
                            <Text style={[styles.cell, styles.right, { width: COL.unit }]}>
                                {formatCents(line.unitPriceCents)}
                            </Text>
                            <Text style={[styles.cell, styles.right, { width: COL.vat }]}>
                                {formatRate(line.taxRate)}
                            </Text>
                            <Text style={[styles.cell, styles.right, { width: COL.total }]}>
                                {formatCents(line.totalCents)}
                            </Text>
                        </View>
                    ))}
                    {shipping && (
                        <View style={styles.row} wrap={false}>
                            <Text style={[styles.cell, { flex: 1 }]}>{shipping.description}</Text>
                            <Text style={[styles.cell, styles.right, { width: COL.qty }]}>1</Text>
                            <Text style={[styles.cell, styles.right, { width: COL.unit }]}>
                                {formatCents(shipping.cents)}
                            </Text>
                            <Text style={[styles.cell, styles.right, { width: COL.vat }]}>
                                {formatRate(shipping.taxRate)}
                            </Text>
                            <Text style={[styles.cell, styles.right, { width: COL.total }]}>
                                {formatCents(shipping.cents)}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.section}>Desglose de IVA</Text>
                <View style={styles.table} wrap={false}>
                    <View style={[styles.row, styles.head]}>
                        <Text style={[styles.cell, styles.headText, { flex: 1 }]}>Tipo de IVA</Text>
                        <Text style={[styles.cell, styles.headText, styles.right, { width: 90 }]}>
                            Base imponible
                        </Text>
                        <Text style={[styles.cell, styles.headText, styles.right, { width: 90 }]}>
                            Cuota
                        </Text>
                        <Text style={[styles.cell, styles.headText, styles.right, { width: 90 }]}>
                            Total
                        </Text>
                    </View>
                    {vat.map((row) => (
                        <View key={row.rate} style={styles.row}>
                            <Text style={[styles.cell, { flex: 1 }]}>{formatRate(row.rate)}</Text>
                            <Text style={[styles.cell, styles.right, { width: 90 }]}>
                                {formatCents(row.baseCents)}
                            </Text>
                            <Text style={[styles.cell, styles.right, { width: 90 }]}>
                                {formatCents(row.taxCents)}
                            </Text>
                            <Text style={[styles.cell, styles.right, { width: 90 }]}>
                                {formatCents(row.grossCents)}
                            </Text>
                        </View>
                    ))}
                    <View style={styles.row}>
                        <Text style={[styles.cell, styles.strong, { flex: 1 }]}>Suma</Text>
                        <Text style={[styles.cell, styles.strong, styles.right, { width: 90 }]}>
                            {formatCents(document.taxBaseCents)}
                        </Text>
                        <Text style={[styles.cell, styles.strong, styles.right, { width: 90 }]}>
                            {formatCents(document.taxAmountCents)}
                        </Text>
                        <Text style={[styles.cell, styles.strong, styles.right, { width: 90 }]}>
                            {formatCents(document.totalCents)}
                        </Text>
                    </View>
                </View>

                <View style={styles.totalBox} wrap={false}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalText}>{formatCents(document.totalCents)}</Text>
                </View>

                <Text style={styles.note}>Los precios incluyen el IVA.</Text>
            </Page>
        </Document>
    );
}

/**
 * Genera el PDF de una factura.
 *
 * @param document - La factura tal como se guardó al emitirla (`invoices.snapshot`), con su emisor.
 * @returns El contenido del archivo PDF.
 *
 * @example
 * const pdf = await renderInvoicePdf(found.document);
 */
export async function renderInvoicePdf(document: InvoiceDocument): Promise<Buffer> {
    return renderToBuffer(<InvoicePdf document={document} />);
}
