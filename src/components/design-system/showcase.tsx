'use client';

import * as React from 'react';
import { Heart, Mail, MoreVertical, Pencil, Search, ShoppingBag, Trash2, Wine } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button, IconButton } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardMedia,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Field,
    FieldControl,
    FieldDescription,
    FieldLabel,
    FieldMessage,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextLink } from '@/components/ui/link';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Stepper } from '@/components/ui/stepper';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag } from '@/components/ui/tag';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormExtrasShowcase, OrganismsShowcase } from './showcase-extra';
import { VariantsShowcase } from './showcase-variants';

/**
 * Bloque de la página de muestra: título de sección y contenido.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-gap-md border-t py-inset-2xl">
            <h2 className="font-display text-3xl">{title}</h2>
            {children}
        </section>
    );
}

/** Fila con elementos alineados y separación estándar. */
function Row({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-wrap items-center gap-gap-sm">{children}</div>;
}

const swatches = [
    'background',
    'foreground',
    'primary',
    'secondary',
    'muted',
    'accent',
    'brand',
    'brand-subtle',
    'destructive',
    'destructive-subtle',
    'success',
    'success-subtle',
    'warning',
    'warning-subtle',
    'info',
    'info-subtle',
    'border',
    'input',
    'link',
    'wine-red',
    'wine-rose',
    'wine-white',
    'wine-sweet',
    'wine-fortified',
];

const wineTones: { tone: BadgeTone; label: string }[] = [
    { tone: 'wine-red', label: 'Tinto' },
    { tone: 'wine-rose', label: 'Rosado' },
    { tone: 'wine-white', label: 'Blanco' },
    { tone: 'wine-sweet', label: 'Dulce' },
    { tone: 'wine-fortified', label: 'Generoso' },
];

/**
 * Página de muestra del sistema de diseño: enseña tokens y componentes con
 * sus variantes, en claro u oscuro y en densidad cómoda o compacta.
 */
export function DesignSystemShowcase() {
    const [dark, setDark] = React.useState(false);
    const [compact, setCompact] = React.useState(false);
    const [terms, setTerms] = React.useState<boolean | 'indeterminate'>(false);
    const [email, setEmail] = React.useState('');
    const emailError = email.length > 0 && !email.includes('@') ? 'Escribe un correo válido.' : '';

    return (
        <div
            className={dark ? 'dark' : undefined}
            data-density={compact ? 'compact' : 'comfortable'}
        >
            <main className="min-h-dvh bg-background text-foreground">
                <div className="container-main py-inset-2xl">
                    <header className="flex flex-col gap-gap-md pb-inset-xl">
                        <p className="text-sm font-medium text-brand">Jotron DS</p>
                        <h1 className="font-display text-5xl">Sistema de diseño</h1>
                        <p className="max-w-2xl text-lg text-muted-foreground">
                            Tokens y componentes de la tienda de Pago de Jotrón, generados desde
                            Figma. Todo usa variables semánticas, así que el modo oscuro y la
                            densidad compacta salen solos.
                        </p>
                        <Row>
                            <div className="flex items-center gap-gap-xs">
                                <Switch id="dark" checked={dark} onCheckedChange={setDark} />
                                <Label htmlFor="dark">Modo oscuro</Label>
                            </div>
                            <div className="flex items-center gap-gap-xs">
                                <Switch
                                    id="compact"
                                    checked={compact}
                                    onCheckedChange={setCompact}
                                />
                                <Label htmlFor="compact">Densidad compacta</Label>
                            </div>
                        </Row>
                    </header>

                    <Section title="Color">
                        <div className="grid grid-cols-2 gap-gap-sm sm:grid-cols-4 lg:grid-cols-6">
                            {swatches.map((name) => (
                                <div key={name} className="flex flex-col gap-gap-2xs">
                                    <div
                                        className="h-14 rounded-sm border"
                                        style={{ background: `var(--${name})` }}
                                    />
                                    <code className="font-mono text-xs">{name}</code>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Tipografía">
                        <div className="flex flex-col gap-gap-sm">
                            <p className="font-display text-6xl">Pago de Jotrón</p>
                            <p className="font-display text-4xl">Funnel Display · 4xl</p>
                            <p className="font-display text-3xl">Funnel Display · 3xl</p>
                            <p className="text-2xl font-semibold">Geist · 2xl semibold</p>
                            <p className="text-xl font-medium">Geist · xl medium</p>
                            <p className="text-base">
                                Geist · base. Vino tinto de crianza con uva Romé y Tempranillo.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Geist · sm · texto de apoyo
                            </p>
                            <p className="text-2xs">Geist · 2xs</p>
                            <code className="font-mono text-sm">Geist Mono · 12,90 €</code>
                        </div>
                    </Section>

                    <Section title="Botones">
                        <Row>
                            <Button>Añadir al carrito</Button>
                            <Button variant="brand">Finalizar compra</Button>
                            <Button variant="outline">Ver detalles</Button>
                            <Button variant="ghost">Cancelar</Button>
                            <Button variant="destructive">
                                <Trash2 /> Borrar
                            </Button>
                            <Button variant="link">Seguir comprando</Button>
                        </Row>
                        <Row>
                            <Button size="xxs">xxs</Button>
                            <Button size="xs">xs</Button>
                            <Button size="sm">sm</Button>
                            <Button size="md">md</Button>
                            <Button size="lg">lg</Button>
                            <Button loading>Guardando</Button>
                            <Button disabled>Desactivado</Button>
                        </Row>
                        <Row>
                            <IconButton aria-label="Favorito" variant="outline" size="xs">
                                <Heart />
                            </IconButton>
                            <IconButton aria-label="Carrito" size="sm">
                                <ShoppingBag />
                            </IconButton>
                            <IconButton aria-label="Buscar" variant="ghost">
                                <Search />
                            </IconButton>
                            <IconButton aria-label="Vino" variant="brand" size="lg">
                                <Wine />
                            </IconButton>
                        </Row>
                        <Row>
                            <TextLink href="#">Enlace por defecto</TextLink>
                            <TextLink href="#" variant="brand">
                                Enlace de marca
                            </TextLink>
                            <TextLink href="#" variant="danger">
                                Darse de baja
                            </TextLink>
                        </Row>
                    </Section>

                    <Section title="Formularios">
                        <div className="grid gap-gap-lg md:grid-cols-2">
                            <Field invalid={!!emailError}>
                                <FieldLabel indicator="required">Correo electrónico</FieldLabel>
                                <FieldControl>
                                    <Input
                                        type="email"
                                        placeholder="tu@correo.es"
                                        startIcon={<Mail />}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </FieldControl>
                                <FieldDescription>Te enviaremos aquí la factura.</FieldDescription>
                                <FieldMessage>{emailError}</FieldMessage>
                            </Field>
                            <Field>
                                <FieldLabel indicator="optional">Denominación de origen</FieldLabel>
                                <Select>
                                    <FieldControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Elige una DO" />
                                        </SelectTrigger>
                                    </FieldControl>
                                    <SelectContent>
                                        <SelectItem value="malaga">Málaga</SelectItem>
                                        <SelectItem value="sierras">Sierras de Málaga</SelectItem>
                                        <SelectItem value="montilla">Montilla-Moriles</SelectItem>
                                        <SelectItem value="jerez" disabled>
                                            Jerez (sin stock)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field>
                                <FieldLabel>Mensaje</FieldLabel>
                                <FieldControl>
                                    <Textarea placeholder="Cuéntanos qué necesitas" />
                                </FieldControl>
                            </Field>
                            <Field disabled>
                                <FieldLabel>Campo desactivado</FieldLabel>
                                <FieldControl>
                                    <Input disabled value="No editable" readOnly />
                                </FieldControl>
                            </Field>
                        </div>
                        <Row>
                            <Input size="xs" placeholder="xs" className="w-32" />
                            <Input size="sm" placeholder="sm" className="w-32" />
                            <Input size="md" placeholder="md" className="w-32" />
                            <Input size="lg" placeholder="lg" className="w-32" />
                        </Row>
                        <div className="grid gap-gap-lg md:grid-cols-3">
                            <div className="flex flex-col gap-gap-sm">
                                <div className="flex items-center gap-gap-xs">
                                    <Checkbox
                                        id="terms"
                                        checked={terms}
                                        onCheckedChange={setTerms}
                                    />
                                    <Label htmlFor="terms">Acepto las condiciones</Label>
                                </div>
                                <div className="flex items-center gap-gap-xs">
                                    <Checkbox id="ind" checked="indeterminate" />
                                    <Label htmlFor="ind">Selección parcial</Label>
                                </div>
                                <div className="flex items-center gap-gap-xs">
                                    <Checkbox id="dis" disabled />
                                    <Label htmlFor="dis">Desactivado</Label>
                                </div>
                            </div>
                            <RadioGroup defaultValue="estandar" aria-label="Tipo de envío">
                                <div className="flex items-center gap-gap-xs">
                                    <RadioGroupItem value="estandar" id="estandar" />
                                    <Label htmlFor="estandar">Envío estándar</Label>
                                </div>
                                <div className="flex items-center gap-gap-xs">
                                    <RadioGroupItem value="urgente" id="urgente" />
                                    <Label htmlFor="urgente">Envío urgente</Label>
                                </div>
                            </RadioGroup>
                            <div className="flex flex-col gap-gap-sm">
                                {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
                                    <div key={size} className="flex items-center gap-gap-xs">
                                        <Switch id={`sw-${size}`} size={size} defaultChecked />
                                        <Label htmlFor={`sw-${size}`}>Switch {size}</Label>
                                    </div>
                                ))}
                                <div className="flex items-center gap-gap-xs">
                                    <Switch id="sw-out" variant="outline" defaultChecked />
                                    <Label htmlFor="sw-out">Switch outline</Label>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Campos avanzados">
                        <FormExtrasShowcase />
                    </Section>

                    <Section title="Feedback">
                        <div className="grid gap-gap-sm md:grid-cols-2">
                            <Alert type="info" title="Envío gratis">
                                A partir de 60 € en península.
                            </Alert>
                            <Alert type="success" title="Pedido confirmado">
                                Te hemos enviado un correo con el resumen.
                            </Alert>
                            <Alert type="warning" title="Stock bajo">
                                Quedan 3 botellas de este formato.
                            </Alert>
                            <Alert type="error" title="Pago rechazado">
                                Revisa los datos de la tarjeta o prueba con otra.
                            </Alert>
                        </div>
                        <Row>
                            <Button
                                variant="outline"
                                onClick={() => toast.success('Vino añadido al carrito')}
                            >
                                Toast éxito
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => toast.error('No queda stock de este formato')}
                            >
                                Toast error
                            </Button>
                            <Button variant="outline" onClick={() => toast.info('Sesión iniciada')}>
                                Toast info
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => toast.warning('Tu sesión caduca pronto')}
                            >
                                Toast aviso
                            </Button>
                        </Row>
                        <Row>
                            <Spinner size="sm" />
                            <Spinner />
                            <Spinner size="lg" variant="neutral" />
                        </Row>
                        <div className="flex max-w-md flex-col gap-gap-sm">
                            <Progress value={65} aria-label="Progreso del pedido" />
                            <Progress
                                value={100}
                                variant="success"
                                size="sm"
                                aria-label="Completado"
                            />
                            <Progress aria-label="Cargando" size="lg" />
                        </div>
                        <div className="flex max-w-md items-center gap-gap-sm">
                            <Skeleton className="size-12 rounded-full" />
                            <div className="flex flex-1 flex-col gap-gap-xs">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                        <Card variant="outlined" className="max-w-md">
                            <EmptyState
                                title="Aún no tienes pedidos"
                                description="Cuando compres, verás aquí el estado de cada pedido."
                                icon={<ShoppingBag />}
                                action={<Button>Ver catálogo</Button>}
                            />
                        </Card>
                    </Section>

                    <Section title="Datos">
                        <Row>
                            {wineTones.map(({ tone, label }) => (
                                <Badge key={tone} tone={tone}>
                                    {label}
                                </Badge>
                            ))}
                        </Row>
                        <Row>
                            <Badge>Neutro</Badge>
                            <Badge tone="brand" variant="solid">
                                Añada 2021
                            </Badge>
                            <Badge tone="success" variant="outline" dot>
                                Entregado
                            </Badge>
                            <Badge tone="warning" dot>
                                En proceso
                            </Badge>
                            <Badge tone="destructive" variant="solid">
                                Anulado
                            </Badge>
                            <Badge tone="info" size="md">
                                Enviado
                            </Badge>
                        </Row>
                        <Row>
                            <Tag onRemove={() => toast('Filtro quitado')}>Tinto</Tag>
                            <Tag tone="brand" onRemove={() => toast('Filtro quitado')}>
                                DO Málaga
                            </Tag>
                            <Tag tone="brand" selected onClick={() => undefined}>
                                Seleccionada
                            </Tag>
                            <Tag size="sm">Pequeña</Tag>
                        </Row>
                        <div className="grid gap-gap-md sm:grid-cols-2 lg:grid-cols-3">
                            <Card interactive>
                                <CardMedia className="flex items-center justify-center text-muted-foreground">
                                    <Wine className="size-12" aria-hidden="true" />
                                </CardMedia>
                                <CardHeader>
                                    <div className="flex items-center gap-gap-xs">
                                        <Badge tone="wine-red">Tinto</Badge>
                                        <Badge tone="brand" variant="outline">
                                            2021
                                        </Badge>
                                    </div>
                                    <CardTitle>
                                        <a href="#" className="outline-none">
                                            Jotrón Romé Crianza
                                        </a>
                                    </CardTitle>
                                    <CardDescription>DO Sierras de Málaga · 75 cl</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-semibold tabular-nums">18,50 €</p>
                                </CardContent>
                                <CardFooter>
                                    <Button size="sm" className="flex-1">
                                        Añadir al carrito
                                    </Button>
                                </CardFooter>
                            </Card>
                            <Card variant="elevated">
                                <CardHeader>
                                    <CardTitle>Card elevated</CardTitle>
                                    <CardDescription>Sombra md para destacar.</CardDescription>
                                </CardHeader>
                                <CardContent>Contenido de la tarjeta.</CardContent>
                            </Card>
                            <Card variant="outlined">
                                <CardHeader>
                                    <CardTitle>Card outlined</CardTitle>
                                    <CardDescription>Solo borde, sin sombra.</CardDescription>
                                </CardHeader>
                                <CardContent>Contenido de la tarjeta.</CardContent>
                            </Card>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pedido</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">#1024</TableCell>
                                    <TableCell>Ana López</TableCell>
                                    <TableCell>
                                        <Badge tone="success" dot>
                                            Entregado
                                        </Badge>
                                    </TableCell>
                                    <TableCell numeric>54,20 €</TableCell>
                                </TableRow>
                                <TableRow aria-selected="true">
                                    <TableCell className="font-medium">#1025</TableCell>
                                    <TableCell>Pedro Ruiz</TableCell>
                                    <TableCell>
                                        <Badge tone="warning" dot>
                                            En proceso
                                        </Badge>
                                    </TableCell>
                                    <TableCell numeric>112,00 €</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">#1026</TableCell>
                                    <TableCell>Lucía Gómez</TableCell>
                                    <TableCell>
                                        <Badge tone="destructive" dot>
                                            Anulado
                                        </Badge>
                                    </TableCell>
                                    <TableCell numeric>9,90 €</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#" isActive>
                                        2
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext href="#" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                        <Row>
                            <Avatar size="sm">
                                <AvatarFallback>JM</AvatarFallback>
                            </Avatar>
                            <Avatar>
                                <AvatarFallback>AL</AvatarFallback>
                            </Avatar>
                            <Avatar size="lg" shape="square">
                                <AvatarFallback>PJ</AvatarFallback>
                            </Avatar>
                        </Row>
                    </Section>

                    <Section title="Overlays">
                        <Row>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline">Abrir diálogo</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Editar dirección</DialogTitle>
                                        <DialogDescription>
                                            Los cambios se aplican a los próximos pedidos.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Field>
                                        <FieldLabel>Calle</FieldLabel>
                                        <FieldControl>
                                            <Input defaultValue="Calle Larios, 5" />
                                        </FieldControl>
                                    </Field>
                                    <DialogFooter>
                                        <Button variant="outline">Cancelar</Button>
                                        <Button>Guardar cambios</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Anular pedido</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            ¿Anular el pedido #1024?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Se devolverá el importe y no se puede deshacer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction tone="danger">
                                            Anular pedido
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Drawer>
                                <DrawerTrigger asChild>
                                    <Button variant="outline">
                                        <ShoppingBag /> Carrito
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent>
                                    <DrawerHeader>
                                        <DrawerTitle>Tu carrito</DrawerTitle>
                                    </DrawerHeader>
                                    <DrawerBody>
                                        <EmptyState
                                            title="Tu carrito está vacío"
                                            icon={<ShoppingBag />}
                                        />
                                    </DrawerBody>
                                    <DrawerFooter>
                                        <Button variant="brand">Finalizar compra</Button>
                                    </DrawerFooter>
                                </DrawerContent>
                            </Drawer>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <IconButton aria-label="Acciones" variant="outline">
                                        <MoreVertical />
                                    </IconButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Vino</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Pencil /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive">
                                        <Trash2 /> Borrar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <IconButton aria-label="Añadir a favoritos" variant="ghost">
                                        <Heart />
                                    </IconButton>
                                </TooltipTrigger>
                                <TooltipContent>Añadir a favoritos</TooltipContent>
                            </Tooltip>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost">Maridaje</Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <p className="font-medium">Maridaje</p>
                                    <p className="text-muted-foreground">
                                        Carnes rojas, guisos y quesos curados.
                                    </p>
                                </PopoverContent>
                            </Popover>
                        </Row>
                    </Section>

                    <Section title="Navegación y layout">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#">Inicio</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#">Vinos</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Tintos</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <Tabs defaultValue="descripcion">
                            <TabsList>
                                <TabsTrigger value="descripcion">Descripción</TabsTrigger>
                                <TabsTrigger value="cata">Nota de cata</TabsTrigger>
                                <TabsTrigger value="bodega">Bodega</TabsTrigger>
                            </TabsList>
                            <TabsContent value="descripcion">
                                Vino de crianza, 12 meses en barrica.
                            </TabsContent>
                            <TabsContent value="cata">
                                Rojo picota, aroma a fruta madura.
                            </TabsContent>
                            <TabsContent value="bodega">
                                Pago de Jotrón, Cómpeta (Málaga).
                            </TabsContent>
                        </Tabs>
                        <Tabs defaultValue="todos">
                            <TabsList variant="contained">
                                <TabsTrigger value="todos">Todos</TabsTrigger>
                                <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                                <TabsTrigger value="enviados">Enviados</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Stepper
                            steps={[
                                { label: 'Carrito', description: '3 productos' },
                                { label: 'Envío', description: 'Dirección' },
                                { label: 'Pago' },
                                { label: 'Confirmación' },
                            ]}
                            current={2}
                        />
                        <div className="grid gap-gap-lg md:grid-cols-2">
                            <Accordion type="single" collapsible variant="flush">
                                <AccordionItem value="envio">
                                    <AccordionTrigger>¿Cuánto tarda el envío?</AccordionTrigger>
                                    <AccordionContent>
                                        De 24 a 72 horas en península.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="edad">
                                    <AccordionTrigger>¿Por qué me pedís la edad?</AccordionTrigger>
                                    <AccordionContent>
                                        La ley no permite vender alcohol a menores de 18 años.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            <Accordion type="multiple" variant="contained" defaultValue={['a']}>
                                <AccordionItem value="a">
                                    <AccordionTrigger>Variante contained</AccordionTrigger>
                                    <AccordionContent>
                                        Cada item es una caja con borde.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="b">
                                    <AccordionTrigger>Segundo item</AccordionTrigger>
                                    <AccordionContent>Contenido.</AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                        <Separator />
                        <div className="flex h-8 items-center gap-gap-sm text-sm">
                            <span>Tienda</span>
                            <Separator orientation="vertical" />
                            <span>Blog</span>
                            <Separator orientation="vertical" />
                            <span>Visitas</span>
                        </div>
                    </Section>

                    <Section title="Variantes y estados">
                        <VariantsShowcase />
                    </Section>

                    <Section title="Organismos">
                        <OrganismsShowcase />
                    </Section>
                </div>
            </main>
        </div>
    );
}
