// context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { Firebase } from "../contextProviders/AuthProvider";

// Define your context type
interface AuthContextType {
    firebaseUser: Firebase.User | null, 
	loading: boolean, 
	logout: () => Promise<void>
    // Add any other actions or state you need
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
};
