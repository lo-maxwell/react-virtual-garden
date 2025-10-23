import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InventoryState {
  gold: number;
}

const initialState: InventoryState = {
  gold: 0,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    // --- GOLD MANAGEMENT ---
    setGold: (state, action: PayloadAction<number>) => {
      state.gold = Math.max(0, action.payload);
    },
    addGold: (state, action: PayloadAction<number>) => {
      state.gold += Math.max(0, action.payload);
    },
    subtractGold: (state, action: PayloadAction<number>) => {
      state.gold = Math.max(0, state.gold - Math.max(0, action.payload));
    },
  },
});

export const {
  setGold,
  addGold,
  subtractGold,
} = inventorySlice.actions;

export default inventorySlice.reducer;
