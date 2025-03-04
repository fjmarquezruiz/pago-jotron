"use client";

import {
    CART_EXPIRY_TIME,
    CART_STORAGE_KEY,
    CartActionTypes,
} from "@/constants";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from "react";

import { CartAction, CartItem, CartState } from "@/types/cart-context";

/**
 * Initial state for the shopping cart
 */
const initialState: CartState = {
    items: [],
    total: 0,
    lastUpdated: Date.now(),
};

/**
 * Context for sharing cart state and dispatch function throughout the app
 */
const CartContext = createContext<{
    state: CartState;
    dispatch: React.Dispatch<CartAction>;
} | null>(null);

/**
 * Helper function to calculate the total price of items in cart
 */
function calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Optimized reducer function with improved type checking and error handling
 */
function cartReducer(state: CartState, action: CartAction): CartState {
    try {
        switch (action.type) {
            case CartActionTypes.ADD_ITEM: {
                const existingItemIndex = state.items.findIndex(
                    (item) => item.id === action.item.id,
                );

                const updatedItems =
                    existingItemIndex !== -1
                        ? state.items.map((item, index) =>
                              index === existingItemIndex
                                  ? { ...item, quantity: item.quantity + 1 }
                                  : item,
                          )
                        : [
                              ...state.items,
                              {
                                  ...action.item,
                                  quantity: action.item.quantity,
                              },
                          ];

                return {
                    ...state,
                    items: updatedItems,
                    total: calculateTotal(updatedItems),
                    lastUpdated: Date.now(),
                };
            }

            case CartActionTypes.REMOVE_ITEM: {
                const updatedItems = state.items.filter(
                    (item) => item.id !== action.itemId,
                );
                return {
                    ...state,
                    items: updatedItems,
                    total: calculateTotal(updatedItems),
                    lastUpdated: Date.now(),
                };
            }

            case CartActionTypes.UPDATE_QUANTITY: {
                if (action.quantity < 1) {
                    console.warn("Invalid quantity update attempted");
                    return state;
                }

                const updatedItems = state.items.map((item) =>
                    item.id === action.itemId
                        ? { ...item, quantity: action.quantity }
                        : item,
                );

                return {
                    ...state,
                    items: updatedItems,
                    total: calculateTotal(updatedItems),
                    lastUpdated: Date.now(),
                };
            }

            default:
                console.warn("Unknown action type:", (action as any).type);
                return state;
        }
    } catch (error) {
        console.error("Error in cart reducer:", error);
        return state;
    }
}

/**
 * CartProvider component that manages cart state and persistence
 * Features:
 * - Loads cart from localStorage on mount
 * - Handles cart expiration
 * - Automatically saves cart changes to localStorage
 * - Provides cart context to child components
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
    // Memoize the calculate total function
    const memoizedCalculateTotal = useCallback(calculateTotal, []);

    const [state, dispatch] = useReducer(cartReducer, initialState, () => {
        if (typeof window === "undefined") return initialState;

        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (!stored) return initialState;

            const parsedCart = JSON.parse(stored);

            // Validate parsed data
            if (!parsedCart || !Array.isArray(parsedCart.items)) {
                localStorage.removeItem(CART_STORAGE_KEY);
                return initialState;
            }

            if (Date.now() - parsedCart.lastUpdated > CART_EXPIRY_TIME) {
                localStorage.removeItem(CART_STORAGE_KEY);
                return initialState;
            }

            return {
                ...parsedCart,
                total: memoizedCalculateTotal(parsedCart.items),
            };
        } catch (error) {
            console.error("Error loading cart from storage:", error);
            localStorage.removeItem(CART_STORAGE_KEY);
            return initialState;
        }
    });

    // Memoize the context value to prevent unnecessary rerenders
    const contextValue = useMemo(() => ({ state, dispatch }), [state]);

    useEffect(() => {
        try {
            if (state.items.length > 0) {
                localStorage.setItem(
                    CART_STORAGE_KEY,
                    JSON.stringify({
                        ...state,
                        lastUpdated: Date.now(),
                    }),
                );
            } else {
                localStorage.removeItem(CART_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Error saving cart to storage:", error);
        }
    }, [state]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
}

/**
 * Custom hook to access cart context
 * Must be used within a CartProvider component
 * @returns {Object} Cart context containing state and dispatch function
 * @throws {Error} If used outside of CartProvider
 */
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
