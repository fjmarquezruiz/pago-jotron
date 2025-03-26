export const APP_NAME = "Bodega Pago de Jotrón";

// Constants for Cloudinary
const CLOUDNAME = 'dtw0se3wn';
export const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDNAME}/image/upload`;

// export const BACKGROUND_HERO = `${CLOUDINARY_BASE_URL}/v1742725117/bg-hero_goit7z.jpg`;
export const BACKGROUND_HERO = `https://res.cloudinary.com/dtw0se3wn/image/upload/v1742725117/bg-hero_goit7z.jpg`;

// Constants for the shopping cart

export const CART_STORAGE_KEY = 'shopping-cart';

export const CART_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

export enum CartActionTypes {
    ADD_ITEM = "ADD_ITEM",
    REMOVE_ITEM = "REMOVE_ITEM",
    UPDATE_QUANTITY = "UPDATE_QUANTITY"
}


// Constants for toast notifications

// Constants for toast behavior
export const TOAST_LIMIT = 1; // Maximum number of toasts to display simultaneously
export const TOAST_REMOVE_DELAY = 1000000; // Delay before removing a dismissed toast (in milliseconds)

// Enum for action types to ensure type safety and readability
export enum ToastActionTypes {
    ADD_TOAST = "ADD_TOAST",
    UPDATE_TOAST = "UPDATE_TOAST",
    DISMISS_TOAST = "DISMISS_TOAST",
    REMOVE_TOAST = "REMOVE_TOAST",
}
