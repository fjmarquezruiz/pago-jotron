export function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "ADD_ITEM": {
            // ... existing add logic
            return {
                ...newState,
                lastUpdated: Date.now()
            };
        }
        case "UPDATE_QUANTITY": {
            // ... existing update logic
            return {
                ...newState,
                lastUpdated: Date.now()
            };
        }
        case "REMOVE_ITEM": {
            // ... existing remove logic
            return {
                ...newState,
                lastUpdated: Date.now()
            };
        }
        case "CLEAR_CART": {
            return {
                items: [],
                total: 0,
                lastUpdated: Date.now()
            };
        }
        default:
            return state;
    }
} 