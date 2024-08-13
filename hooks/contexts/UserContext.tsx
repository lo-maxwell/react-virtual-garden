import User from '@/models/user/User';
import React, { createContext, useContext } from 'react';

// Define your context type
interface UserContextType {
    user: User;
    username: string;
    handleChangeUsername: (newUsername: string) => void;
    icon: string;
    handleChangeIcon: (newIcon: string) => void;
    resetUser: () => void;
    // Add any other actions or state you need
}

// Create a context with default values
export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};