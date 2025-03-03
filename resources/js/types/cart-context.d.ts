import { CartActionTypes } from "@/constants";

export interface CartItem {
    id: number;
    name: string;
    price: number;
    description: string;
    quantity: number;
    imageUrl: string;
    region: string;
}

export interface CartState {
    items: CartItem[];
    total: number;
    lastUpdated: number;
}

export type CartAction =
    | { type: CartActionTypes.ADD_ITEM; item: Omit<CartItem, "quantity"> }
    | { type: CartActionTypes.REMOVE_ITEM; itemId: number }
    | { type: CartActionTypes.UPDATE_QUANTITY; itemId: number; quantity: number };