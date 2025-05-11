import LevelSystem from '@/models/level/LevelSystem';
import User from '@/models/user/User';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultConfig } from 'next/dist/server/config-shared';

interface LevelState {
    [id: string]: {
        level: number;
        currentExp: number;
        expToLevelUp: number;
    };
}

const initialState: LevelState = {};

const defaultLevelSystem = User.generateDefaultLevelSystem();
const defaultValues = {level: defaultLevelSystem.getLevel(), currentExp: defaultLevelSystem.getCurrentExp(), expToLevelUp: defaultLevelSystem.getExpToLevelUp(), }

const userLevelSystemSlice = createSlice({
    name: 'userLevelSystem',
    initialState,
    reducers: {
        setUserLevel(state, action: PayloadAction<{ id: string; level: number }>) {
            const { id, level } = action.payload;
            if (!state[id]) {
                state[id] = { ...defaultValues }; // Initialize if not exists
            }
            // Create a new object to avoid mutating the existing state directly
            state[id] = {
                ...state[id],
                level,
            };
        },
        setCurrentExp(state, action: PayloadAction<{ id: string; currentExp: number }>) {
            const { id, currentExp } = action.payload;
            if (!state[id]) {
                state[id] = { ...defaultValues }; // Initialize if not exists
            }
            // Create a new object to avoid mutating the existing state directly
            state[id] = {
                ...state[id],
                currentExp,
            };
        },
        setExpToLevelUp(state, action: PayloadAction<{ id: string; expToLevelUp: number }>) {
            const { id, expToLevelUp } = action.payload;
            if (!state[id]) {
                state[id] = { ...defaultValues }; // Initialize if not exists
            }
            // Create a new object to avoid mutating the existing state directly
            state[id] = {
                ...state[id],
                expToLevelUp,
            };
        },
        setAllLevelSystemValues(state, action: PayloadAction<{ id: string; level: number; currentExp: number; expToLevelUp: number }>) {
            const { id, level, currentExp, expToLevelUp } = action.payload;
            if (!state[id]) {
                state[id] = { ...defaultValues }; // Initialize if not exists
            }
            // Create a new object to avoid mutating the existing state directly
            state[id] = {
                ...state[id],
                level,
                currentExp,
                expToLevelUp,
            };
        }
    },
});

export const {
    setUserLevel,
    setCurrentExp,
    setExpToLevelUp,
    setAllLevelSystemValues
} = userLevelSystemSlice.actions;

export default userLevelSystemSlice.reducer;
