import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    last_name: string,
    date_of_birth: string,
    email: string;
    email_verified_at?: string;
    password: string;
    id_card?: string,
    phone_number?: string,
    account_status: boolean,
    age_verified: boolean,
    created_at: string;
    permissions: string[];
    roles: string[];
}

export interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: Links[];
}

export type PaginatedData<T = any> = {
    data: T[];
    links: Record<string, string>;
    meta: PaginationMeta;
}

export type Feature = {
    id: number;
    name: string;
    description: string;
    user: User;
    created_at: string;
}

export type Bodega = {
    id: number;
    name: string;
    city: string;
    province: string;
    province_id: number;
    blocked: boolean;
    denominaciones: Denominacion[];
    created_at: string;
}

// Define the structure of the BodegaSectionProps
export interface BodegaSectionProps {
    data: Bodega;
    onChange?: (field: keyof Bodega, value: any) => void;
    errors?: Record<string, string>;
    readonly?: boolean;
    disabled?: boolean;
    preview?: boolean;
}

export type Denominacion = {
    id: number;
    name: string;
    blocked: boolean;
}

export type Categoria = {
    id: number;
    name: string;
    created_at: string;
}

export interface Uva {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    pivot: {
        vino_id: number;
        percent: number;
        name: string;
    };
}

// Define the structure of the UvaSectionProps
export interface UvaSectionProps {
    data: Uva;
    onChange?: (field: keyof Uva, value: any) => void;
    errors?: Record<string, string>;
    readonly?: boolean;
    disabled?: boolean;
    preview?: boolean;
}

// Define the structure of the UvaOption
interface UvaOption {
    id: number;
    name: string;
    percent: number;
}


export interface Direccion {
    id: number;
    phone: string;
    street_type: string;
    street_name: string;
    street_number: string;
    postal_code: string;
    city: string;
    state: string;
    country: string;
    address_type: string;
    is_billing: boolean;
}

// Define the structure of the GenericSectionProps
export interface GenericSectionProps<T> {
    data: T; // Use a generic type T
    onChange?: (field: keyof T, value: any) => void;
    errors?: Record<string, string>;
    readonly?: boolean;
    disabled?: boolean;
    preview?: boolean;
}


export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
};


// Table component
export interface TableData {
    [key: string]: string | number | boolean | Bodega | Denominacion | Categoria | null;
}

export interface TableProps {
    data: TableData[];
}
