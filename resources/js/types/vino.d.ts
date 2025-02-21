import { Bodega, Categoria, Denominacion, Uva } from ".";

// import { Vino } from ".";
export type Vino = {
    id: number;
    name: string;
    price: number;
    stock: number;
    vintage_year?: number;
    image?: File;
    image_url?: string;
    description?: string;
    visual?: string;
    aromas?: string;
    taste?: string;
    capacity?: number;
    minimum_temperature?: number;
    maximum_temperature?: number;
    alcohol?: number;
    food_pairing?: string;
    blocked?: boolean;
    bodega_id: number;
    denominacion_id: number;
    categoria_id: number;
    bodega?: Bodega;
    denominacion?: Denominacion;
    categoria?: Categoria;
    uvas?: Uva[];
    created_at: string;
    updated_at: string;
}

// Define the structure of the VinoOption
export interface VinoOption {
    id: number;
    name: string;
}

// Define the structure of the VinoSectionProps
export interface VinoSectionProps {
    data: Vino;
    onChange?: (field: keyof Vino, value: any) => void;
    errors?: Record<string, string>;
    readonly?: boolean;
    disabled?: boolean;
    preview?: boolean;
}

