'use client';

import * as React from 'react';
import {
    Euro,
    Home,
    LayoutDashboard,
    MapPin,
    Package,
    Search,
    ShoppingBag,
    User,
    Users,
    Wine,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BottomNavigation, BottomNavigationItem } from '@/components/ui/bottom-navigation';
import { IconButton } from '@/components/ui/button';
import { CategoryField } from '@/components/ui/category-field';
import { CodeBlock } from '@/components/ui/code-block';
import { Container } from '@/components/ui/container';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Fieldset, SwitchGroupItem } from '@/components/ui/fieldset';
import { FileItem, FileUpload } from '@/components/ui/file-upload';
import { List, ListItem } from '@/components/ui/list';
import { MetricCard } from '@/components/ui/metric-card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Navbar, NavbarItem } from '@/components/ui/navbar';
import { NumberInput } from '@/components/ui/number-input';
import { OTPInput } from '@/components/ui/otp-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { SearchInput } from '@/components/ui/search-input';
import { Sidebar, SidebarGroupLabel, SidebarItem } from '@/components/ui/sidebar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/ui/time-picker';

const grapes = [
    { value: 'tempranillo', label: 'Tempranillo' },
    { value: 'syrah', label: 'Syrah' },
    { value: 'pedro-ximenez', label: 'Pedro Ximénez' },
    { value: 'moscatel', label: 'Moscatel' },
    { value: 'palomino', label: 'Palomino' },
];

/** Fecha de hace 18 años: límite para la verificación de edad (RF2). */
const adultLimit = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
})();

/**
 * Campos avanzados de la página de muestra: búsqueda, número, teléfono, OTP,
 * selección múltiple, fecha, hora, rango y subida de archivos.
 */
export function FormExtrasShowcase() {
    const [q, setQ] = React.useState('');
    const [qty, setQty] = React.useState(1);
    const [prefix, setPrefix] = React.useState('+34');
    const [otp, setOtp] = React.useState('');
    const [selected, setSelected] = React.useState<string[]>(['tempranillo']);
    const [tags, setTags] = React.useState<string[]>(['Crianza', 'Ecológico']);
    const [birth, setBirth] = React.useState<Date>();
    const [time, setTime] = React.useState<string>();
    const [price, setPrice] = React.useState([10, 40]);

    return (
        <div className="grid gap-gap-md md:grid-cols-2">
            <div className="flex flex-col gap-gap-md">
                <SearchInput
                    aria-label="Buscar vinos"
                    placeholder="Buscar vinos"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onClear={() => setQ('')}
                />
                <Field>
                    <FieldLabel>Cantidad</FieldLabel>
                    <FieldControl>
                        <NumberInput value={qty} onValueChange={setQty} min={1} max={12} />
                    </FieldControl>
                </Field>
                <Field>
                    <FieldLabel>Teléfono</FieldLabel>
                    <FieldControl>
                        <PhoneInput
                            prefix={prefix}
                            onPrefixChange={setPrefix}
                            placeholder="600 000 000"
                        />
                    </FieldControl>
                </Field>
                <div className="flex flex-col gap-gap-xs">
                    <span className="text-sm font-medium">Código de verificación</span>
                    <OTPInput
                        aria-label="Código de verificación"
                        value={otp}
                        onValueChange={setOtp}
                        size="sm"
                    />
                </div>
                <Field>
                    <FieldLabel>Uvas</FieldLabel>
                    <FieldControl>
                        <MultiSelect
                            options={grapes}
                            value={selected}
                            onValueChange={setSelected}
                            placeholder="Elige uvas"
                        />
                    </FieldControl>
                </Field>
                <Field>
                    <FieldLabel>Etiquetas</FieldLabel>
                    <FieldControl>
                        <CategoryField
                            value={tags}
                            onValueChange={setTags}
                            placeholder="Escribe y pulsa Enter"
                        />
                    </FieldControl>
                </Field>
            </div>
            <div className="flex flex-col gap-gap-md">
                <Field>
                    <FieldLabel>Fecha de nacimiento</FieldLabel>
                    <FieldControl>
                        <DatePicker value={birth} onValueChange={setBirth} max={adultLimit} />
                    </FieldControl>
                    <FieldDescription>Tienes que ser mayor de edad para comprar.</FieldDescription>
                </Field>
                <Field>
                    <FieldLabel>Hora de la visita</FieldLabel>
                    <FieldControl>
                        <TimePicker value={time} onValueChange={setTime} from="10:00" to="18:00" />
                    </FieldControl>
                </Field>
                <div className="flex flex-col gap-gap-xs">
                    <span className="text-sm font-medium">
                        Precio: {price[0]} € – {price[1]} €
                    </span>
                    <Slider
                        value={price}
                        onValueChange={setPrice}
                        min={0}
                        max={100}
                        thumbLabels={['Precio mínimo', 'Precio máximo']}
                    />
                </div>
                <Fieldset legend="Notificaciones" helper="Puedes cambiarlo cuando quieras.">
                    <SwitchGroupItem id="n-ped" label="Estado de mis pedidos">
                        <Switch id="n-ped" defaultChecked />
                    </SwitchGroupItem>
                    <SwitchGroupItem
                        id="n-news"
                        label="Novedades y catas"
                        description="Un correo al mes como mucho."
                    >
                        <Switch id="n-news" />
                    </SwitchGroupItem>
                </Fieldset>
                <FileUpload
                    onFiles={() => undefined}
                    accept="image/*"
                    multiple
                    hint="PNG o JPG, hasta 5 MB"
                />
                <div className="flex flex-col gap-gap-xs">
                    <FileItem
                        name="etiqueta-tinto.png"
                        size={240000}
                        status="uploading"
                        progress={40}
                        onRemove={() => undefined}
                    />
                    <FileItem
                        name="botella.jpg"
                        size={1800000}
                        status="success"
                        onRemove={() => undefined}
                    />
                    <FileItem
                        name="ficha.pdf"
                        size={9000000}
                        status="error"
                        error="Supera los 5 MB."
                        onRemove={() => undefined}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Organismos de la página de muestra: navegación, lista, métricas, código,
 * grupo de avatares y contenedor.
 */
export function OrganismsShowcase() {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <div className="flex flex-col gap-gap-md">
            <div className="overflow-hidden rounded-xl border border-border">
                <Navbar
                    brand={<span className="font-display text-lg">Pago de Jotrón</span>}
                    actions={
                        <>
                            <IconButton variant="ghost" aria-label="Buscar">
                                <Search />
                            </IconButton>
                            <IconButton variant="ghost" aria-label="Carrito">
                                <ShoppingBag />
                            </IconButton>
                        </>
                    }
                >
                    <NavbarItem href="#" current>
                        Vinos
                    </NavbarItem>
                    <NavbarItem href="#">Visitas</NavbarItem>
                    <NavbarItem href="#">Bodega</NavbarItem>
                    <NavbarItem href="#">Blog</NavbarItem>
                </Navbar>
            </div>

            <div className="max-w-sm overflow-hidden rounded-xl border border-border">
                <BottomNavigation className="md:flex">
                    <BottomNavigationItem href="#" icon={<Home />} label="Inicio" current />
                    <BottomNavigationItem href="#" icon={<Wine />} label="Vinos" />
                    <BottomNavigationItem
                        href="#"
                        icon={<ShoppingBag />}
                        label="Carrito"
                        badge={3}
                    />
                    <BottomNavigationItem href="#" icon={<User />} label="Cuenta" />
                </BottomNavigation>
            </div>

            <div className="flex flex-col gap-gap-md md:flex-row">
                <div className="flex flex-col gap-gap-xs">
                    <label className="flex items-center gap-gap-xs text-sm">
                        <Switch checked={collapsed} onCheckedChange={setCollapsed} size="xs" />
                        Plegar barra lateral
                    </label>
                    <div className="h-96 overflow-hidden rounded-xl border border-border">
                        <Sidebar
                            collapsed={collapsed}
                            header={
                                <span className="font-display text-lg">
                                    {collapsed ? 'PJ' : 'Panel'}
                                </span>
                            }
                            footer={
                                <SidebarItem href="#" icon={<User />}>
                                    Javier
                                </SidebarItem>
                            }
                        >
                            <SidebarItem href="#" icon={<LayoutDashboard />}>
                                Resumen
                            </SidebarItem>
                            <SidebarItem
                                href="#"
                                icon={<Package />}
                                current
                                trailing={<Badge size="xs">4</Badge>}
                            >
                                Pedidos
                            </SidebarItem>
                            <SidebarGroupLabel>Catálogo</SidebarGroupLabel>
                            <SidebarItem href="#" icon={<Wine />}>
                                Vinos
                            </SidebarItem>
                            <SidebarItem href="#" level={2}>
                                Categorías
                            </SidebarItem>
                            <SidebarItem href="#" icon={<Users />}>
                                Usuarios
                            </SidebarItem>
                        </Sidebar>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-gap-md">
                    <div className="grid gap-gap-sm sm:grid-cols-2">
                        <MetricCard
                            label="Ventas del mes"
                            value="12.480,50 €"
                            icon={<Euro />}
                            trend="+12 %"
                            caption="frente al mes pasado"
                        />
                        <MetricCard
                            label="Pedidos"
                            value="128"
                            icon={<Package />}
                            trend="-3 %"
                            trendDirection="down"
                            caption="frente al mes pasado"
                        />
                    </div>
                    <List divided bordered>
                        <ListItem
                            leading={<MapPin />}
                            title="Casa"
                            description="Calle Real 3, 29700 Vélez-Málaga"
                            trailing={<Badge tone="brand">Principal</Badge>}
                        />
                        <ListItem
                            leading={<MapPin />}
                            title="Trabajo"
                            description="Av. de Andalucía 10, 29002 Málaga"
                        />
                        <ListItem
                            asChild
                            leading={<Package />}
                            title="Pedido #1042"
                            description="Enviado"
                        >
                            <a href="#" />
                        </ListItem>
                    </List>
                    <AvatarGroup max={3}>
                        <Avatar>
                            <AvatarFallback>JM</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback>AR</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback>LG</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback>PS</AvatarFallback>
                        </Avatar>
                        <Avatar>
                            <AvatarFallback>MT</AvatarFallback>
                        </Avatar>
                    </AvatarGroup>
                </div>
            </div>

            <CodeBlock
                language="tsx"
                showLineNumbers
                code={`// Botón de compra con estado de carga
export function BuyButton({ loading }: { loading: boolean }) {
    return <Button variant="brand" loading={loading}>Añadir al carrito</Button>;
}
const total = 2 * 12.5;`}
            />

            <Container
                maxWidth="sm"
                className="rounded-xl border border-dashed border-border py-inset-md text-center text-sm text-muted-foreground"
            >
                Container maxWidth=&quot;sm&quot; (640 px)
            </Container>
        </div>
    );
}
