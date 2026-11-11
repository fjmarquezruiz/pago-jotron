'use client';

import * as React from 'react';
import { Heart, Info, Package, Wine } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Fieldset, SwitchGroupItem } from '@/components/ui/fieldset';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button, IconButton } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { List, ListEmpty, ListItem, ListSkeleton } from '@/components/ui/list';
import { MetricCard } from '@/components/ui/metric-card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Navbar, NavbarItem } from '@/components/ui/navbar';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
    PaginationSummary,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverHeader, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SeparatorWithLabel } from '@/components/ui/separator';
import { Sidebar, SidebarItem, SidebarSubmenu } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Step } from '@/components/ui/step';
import { Stepper } from '@/components/ui/stepper';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
    TableSkeleton,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag } from '@/components/ui/tag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const grapes = ['Tempranillo', 'Syrah', 'Pedro Ximénez', 'Moscatel', 'Palomino'].map((l) => ({
    value: l.toLowerCase(),
    label: l,
}));

const wines = [
    { name: 'Jotrón Tinto 2021', price: 18.5 },
    { name: 'Moscatel de Alejandría', price: 12 },
    { name: 'Pedro Ximénez Dulce', price: 24.9 },
];

/** Bloque con título pequeño dentro de la sección de variantes. */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col gap-gap-sm">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {children}
        </div>
    );
}

/**
 * Variantes y estados añadidos en la segunda revisión de Jotron DS: contadores, estados
 * de carga y vacío, ordenación, tamaños y variantes de navegación.
 */
export function VariantsShowcase() {
    const [fav, setFav] = React.useState(true);
    const [sel, setSel] = React.useState(['tempranillo', 'syrah', 'pedro ximénez', 'moscatel']);
    const [country, setCountry] = React.useState<string | undefined>('es');
    const [sort, setSort] = React.useState<'ascending' | 'descending'>('ascending');
    const [collapsed, setCollapsed] = React.useState(false);
    const [notes, setNotes] = React.useState('Visita a la sala de barricas.');
    const sorted = [...wines].sort((a, b) =>
        sort === 'ascending' ? a.price - b.price : b.price - a.price,
    );

    return (
        <div className="grid gap-gap-lg lg:grid-cols-2">
            <Block title="Badge count, Tag con icono, Avatar con estado, IconButton selected">
                <div className="flex flex-wrap items-center gap-gap-sm">
                    <Badge count={3} tone="brand" variant="solid" />
                    <Badge count={128} tone="destructive" variant="solid" size="md" />
                    <Tag leading={<Wine />} tone="brand">
                        Tinto
                    </Tag>
                    {(['online', 'away', 'busy', 'offline'] as const).map((s) => (
                        <Avatar key={s} status={s}>
                            <AvatarFallback>JM</AvatarFallback>
                        </Avatar>
                    ))}
                    <IconButton
                        aria-label="Favorito"
                        variant="ghost"
                        selected={fav}
                        onClick={() => setFav(!fav)}
                    >
                        <Heart />
                    </IconButton>
                </div>
            </Block>

            <Block title="Tooltip por tipo y Popover con cabecera">
                <div className="flex flex-wrap items-center gap-gap-sm">
                    {(['default', 'info', 'success', 'warning', 'error'] as const).map((t) => (
                        <Tooltip key={t}>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {t}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent type={t} size="sm">
                                Tooltip {t}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                Maridaje
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverHeader title="Maridaje" description="Sugerencias del enólogo" />
                            Carnes rojas y quesos curados.
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                Ordenar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem selected>Precio</DropdownMenuItem>
                            <DropdownMenuItem>Añada</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Block>

            <Block title="Select con icono, cargando y vaciar · MultiSelect con +N">
                <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger
                        startIcon={<Package />}
                        onClear={() => setCountry(undefined)}
                        aria-label="Envío"
                    >
                        <SelectValue placeholder="Tipo de envío" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="es">Península</SelectItem>
                        <SelectItem value="ic">Canarias</SelectItem>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger loading aria-label="Bodega">
                        <SelectValue placeholder="Cargando bodegas" />
                    </SelectTrigger>
                    <SelectContent />
                </Select>
                <MultiSelect
                    options={grapes}
                    value={sel}
                    onValueChange={setSel}
                    maxVisible={2}
                    clearable
                    aria-label="Uvas"
                />
                <Slider defaultValue={[30]} size="lg" invalid thumbLabels={['Grado']} />
            </Block>

            <Block title="Alert con cerrar · Divider con texto · Skeleton · CodeBlock inline">
                <Alert type="info" title="Envío gratis" onClose={() => undefined}>
                    A partir de 60 € en península.
                </Alert>
                <SeparatorWithLabel>o</SeparatorWithLabel>
                <div className="flex items-center gap-gap-sm">
                    <Skeleton variant="circle" />
                    <div className="flex flex-1 flex-col gap-gap-xs">
                        <Skeleton variant="text" className="w-1/2" />
                        <Skeleton variant="text" />
                    </div>
                </div>
                <CodeBlock inline code="pnpm add sonner" />
            </Block>

            <Block title="Card selected · MetricCard neutral, cargando y vacía">
                <div className="grid gap-gap-sm sm:grid-cols-2">
                    <Card selected>
                        <CardHeader>
                            <CardTitle>Caja de 6 botellas</CardTitle>
                            <CardDescription>Formato elegido</CardDescription>
                        </CardHeader>
                    </Card>
                    <MetricCard
                        label="Devoluciones"
                        value="2"
                        trend="0 %"
                        trendDirection="neutral"
                    />
                    <MetricCard label="Ventas del mes" loading />
                    <MetricCard label="Visitas" />
                </div>
            </Block>

            <Block title="List seleccionada, vacía y cargando">
                <List divided bordered>
                    <ListItem
                        selected
                        chevron
                        leading={<Package />}
                        title="Pedido #1042"
                        description="Enviado"
                    />
                    <ListItem
                        chevron
                        leading={<Package />}
                        title="Pedido #1038"
                        description="Entregado"
                    />
                </List>
                <List bordered>
                    <ListEmpty title="Sin direcciones" description="Las que añadas saldrán aquí." />
                </List>
                <List divided bordered aria-busy="true">
                    <ListSkeleton rows={2} />
                </List>
            </Block>

            <Block title="Tabla ordenable">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vino</TableHead>
                            <TableHead
                                sort={sort}
                                onSort={() =>
                                    setSort(sort === 'ascending' ? 'descending' : 'ascending')
                                }
                            >
                                Precio
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((w) => (
                            <TableRow key={w.name}>
                                <TableCell>{w.name}</TableCell>
                                <TableCell numeric>
                                    {w.price.toFixed(2).replace('.', ',')} €
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Block>

            <Block title="Tabs vertical y grande · Accordion sm con descripción">
                <Tabs defaultValue="a" orientation="vertical" className="flex">
                    <TabsList size="lg">
                        <TabsTrigger value="a">Pedidos</TabsTrigger>
                        <TabsTrigger value="b">Direcciones</TabsTrigger>
                    </TabsList>
                    <TabsContent value="a">Tus últimos pedidos.</TabsContent>
                    <TabsContent value="b">Tus direcciones.</TabsContent>
                </Tabs>
                <Accordion type="single" collapsible size="sm" variant="contained">
                    <AccordionItem value="a">
                        <AccordionTrigger description="Península, Baleares y Canarias">
                            Envíos
                        </AccordionTrigger>
                        <AccordionContent>De 24 a 72 horas.</AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Block>

            <Block title="Stepper progress-bar · Breadcrumb lg · Paginación móvil">
                <Stepper
                    variant="progress-bar"
                    size="sm"
                    current={1}
                    steps={[{ label: 'Envío' }, { label: 'Pago' }, { label: 'Confirmación' }]}
                />
                <Breadcrumb>
                    <BreadcrumbList size="lg">
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">Inicio</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Tintos</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationSummary page={3} total={10} />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href="#" />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </Block>

            <Block title="Navbar inverse · Step">
                <div className="overflow-hidden rounded-xl">
                    <Navbar
                        variant="inverse"
                        brand={<span className="font-display text-lg">Pago de Jotrón</span>}
                    >
                        <NavbarItem href="#" current icon={<Wine />}>
                            Vinos
                        </NavbarItem>
                        <NavbarItem href="#">Visitas</NavbarItem>
                    </Navbar>
                </div>
                <Step
                    title="Recepción en la bodega"
                    status="completed"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onRemove={() => undefined}
                />
                <Step title="Cata de tres vinos" status="current" />
            </Block>

            <Block title="Sidebar con botón de plegar y submenú">
                <div className="h-72 w-fit overflow-hidden rounded-xl border border-border">
                    <Sidebar
                        collapsed={collapsed}
                        onCollapsedChange={setCollapsed}
                        header={<span className="font-display">Panel</span>}
                    >
                        <SidebarItem href="#" icon={<Info />}>
                            Resumen
                        </SidebarItem>
                        <SidebarSubmenu label="Catálogo" icon={<Wine />} defaultOpen current>
                            <SidebarItem href="#" level={2} current icon={<Wine />}>
                                Vinos
                            </SidebarItem>
                            <SidebarItem href="#" level={2} icon={<Package />}>
                                Categorías
                            </SidebarItem>
                        </SidebarSubmenu>
                    </Sidebar>
                </div>
            </Block>

            <Block title="Field lg con error · Fieldset en fila · MultiSelect cargando">
                <Field size="lg" invalid>
                    <FieldLabel>Correo electrónico</FieldLabel>
                    <FieldControl>
                        <Input size="lg" defaultValue="javier@" />
                    </FieldControl>
                    <FieldMessage>Escribe un correo completo.</FieldMessage>
                </Field>
                <Fieldset
                    legend="Avisos"
                    orientation="horizontal"
                    helper="Puedes cambiarlo cuando quieras."
                >
                    <SwitchGroupItem id="h-ped" label="Pedidos" description="Cambios de estado">
                        <Switch id="h-ped" defaultChecked />
                    </SwitchGroupItem>
                    <SwitchGroupItem id="h-news" label="Novedades" description="Un correo al mes">
                        <Switch id="h-news" />
                    </SwitchGroupItem>
                </Fieldset>
                <MultiSelect
                    options={grapes}
                    value={[]}
                    onValueChange={() => undefined}
                    loading
                    startIcon={<Wine />}
                    placeholder="Cargando uvas"
                    aria-label="Uvas"
                />
            </Block>

            <Block title="FileUpload cargando, con error y con archivo">
                <div className="grid gap-gap-sm sm:grid-cols-3">
                    <FileUpload size="xs" loading onFiles={() => undefined} hint="PNG o JPG" />
                    <FileUpload
                        size="xs"
                        error="Este tipo de archivo no vale."
                        onFiles={() => undefined}
                        hint="PNG o JPG"
                    />
                    <FileUpload
                        size="xs"
                        file={{ name: 'etiqueta.png', size: 240000 }}
                        onRemove={() => undefined}
                        onFiles={() => undefined}
                    />
                </div>
            </Block>

            <Block title="Tabla compacta (xs) vacía y cargando · Tabs con scroll">
                <Table size="xs">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead align="right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableSkeleton rows={2} columns={2} />
                    </TableBody>
                </Table>
                <Table size="xs">
                    <TableBody>
                        <TableEmpty colSpan={2}>Todavía no hay pedidos.</TableEmpty>
                    </TableBody>
                </Table>
                <Tabs defaultValue="t0">
                    <TabsList scrollable size="sm">
                        {[
                            'Tintos',
                            'Blancos',
                            'Rosados',
                            'Dulces',
                            'Generosos',
                            'Espumosos',
                            'Pasas',
                            'Visitas',
                        ].map((t, i) => (
                            <TabsTrigger key={t} value={`t${i}`}>
                                {t}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </Block>
        </div>
    );
}
