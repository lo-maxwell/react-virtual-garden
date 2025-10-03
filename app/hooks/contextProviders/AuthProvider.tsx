'use client'
import { auth } from "@/utils/firebase/firebaseConfig";
import { ReactNode, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

//Renaming firebase's user class to avoid naming conflicts with existing user class
export namespace Firebase {
    export type User = FirebaseUser; // Create a type alias within the namespace

    // You can also add additional functionality or types here
    export interface ExtendedUser {
        // Add any additional properties you want
        customProperty?: string;
    }
}

// Define props for the provider
interface AccountProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AccountProviderProps) {
	const [firebaseUser, setFirebaseUser] = useState<Firebase.User | null>(null);
	const [loading, setLoading] = useState(true);
  
	useEffect(() => {
		if (!auth) {
			console.log('Firebase auth is not available');
			setLoading(false);
			return;
		}
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setFirebaseUser(user);
			setLoading(false);
		});
		return unsubscribe;
	}, []);
  
	const logout = useCallback(async () => {
		if (!auth) {
			console.log('Firebase auth is not available');
			return;
		}
		signOut(auth);
	}, []);
  
	return (
	  <AuthContext.Provider value={{ firebaseUser, loading, logout }}>
		{children}
	  </AuthContext.Provider>
	);
  }