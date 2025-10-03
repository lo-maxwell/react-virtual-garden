// AuthComponent.tsx
import React, { useCallback, useContext, useEffect, useState } from 'react';
// Import the AuthContext
import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { useAuth } from '@/app/hooks/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const AuthLogoutComponent = ({message, setMessage}: {message: string; setMessage: React.Dispatch<React.SetStateAction<string>>}) => {
    const { firebaseUser, logout } = useAuth();
    const { setGuestMode } = useAccount();
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        setMessage('');
        try {
            await logout();
            setMessage('User logged out successfully.');
            setGuestMode(false);
            router.push('/login');
        } catch {
            setMessage('Logout failed. Please try again.');
        }
    }, [logout, setMessage, setGuestMode, router]);

    return (
        <>
            <div>
                <p className="text-center">Welcome, {firebaseUser!.email}</p>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white p-2 rounded w-full hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
            {message && <p className="mt-4 text-center text-red-500">{message}</p>}
        </>
    );
};

export default AuthLogoutComponent;