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
                state[id] = defaultValues; // Initialize if not exists
            }
            state[id].level = level;
        },
        setCurrentExp(state, action: PayloadAction<{ id: string; currentExp: number }>) {
            const { id, currentExp } = action.payload;
            if (!state[id]) {
                state[id] = defaultValues; // Initialize if not exists
            }
            state[id].currentExp = currentExp;
        },
        setExpToLevelUp(state, action: PayloadAction<{ id: string; expToLevelUp: number }>) {
            const { id, expToLevelUp } = action.payload;
            if (!state[id]) {
                state[id] = defaultValues; // Initialize if not exists
            }
            state[id].expToLevelUp = expToLevelUp;
        },
        setAllLevelSystemValues(state, action: PayloadAction<{ id: string; level: number; currentExp: number; expToLevelUp: number }>) {
            const { id, level, currentExp, expToLevelUp } = action.payload;
            if (!state[id]) {
                state[id] = defaultValues; // Initialize if not exists
            }
            state[id].level = level;
            state[id].currentExp = currentExp;
            state[id].expToLevelUp = expToLevelUp;
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
