"use client";

import { createContext, useContext, useMemo, useReducer } from "react";

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    region: string;
}

interface CartState {
    items: CartItem[];
    total: number;
}

type CartAction =
    | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
    | { type: "REMOVE_ITEM"; itemId: number }
    | { type: "UPDATE_QUANTITY"; itemId: number; quantity: number };

const CartContext = createContext<{
    state: CartState;
    dispatch: React.Dispatch<CartAction>;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "ADD_ITEM": {
            const existingItemIndex = state.items.findIndex(
                (item) => item.id === action.item.id,
            );
            if (existingItemIndex !== -1) {
                const updatedItems = [...state.items];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + 1,
                };
                return {
                    ...state,
                    items: updatedItems,
                    total: calculateTotal(updatedItems),
                };
            }
            const newItems = [...state.items, { ...action.item, quantity: 1 }];
            return {
                ...state,
                items: newItems,
                total: calculateTotal(newItems),
            };
        }
        case "REMOVE_ITEM": {
            const newItems = state.items.filter(
                (item) => item.id !== action.itemId,
            );
            return {
                ...state,
                items: newItems,
                total: calculateTotal(newItems),
            };
        }
        case "UPDATE_QUANTITY": {
            if (action.quantity < 1) return state;
            const updatedItems = state.items.map((item) =>
                item.id === action.itemId
                    ? { ...item, quantity: action.quantity }
                    : item,
            );
            return {
                ...state,
                items: updatedItems,
                total: calculateTotal(updatedItems),
            };
        }
        default:
            return state;
    }
}

function calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

    const contextValue = useMemo(() => ({ state, dispatch }), [state]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
