import { configureStore } from '@reduxjs/toolkit';
import inventoryItemReducer from './slices/inventoryItemSlice';
import userLevelSystemReducer from './slices/userLevelSystemSlice';

export const store = configureStore({
    reducer: {
        inventoryItems: inventoryItemReducer,
        userLevelSystem: userLevelSystemReducer
    },
});

// Export types for the state and dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
