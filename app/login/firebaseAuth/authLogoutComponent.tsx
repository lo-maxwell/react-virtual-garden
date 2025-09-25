// AuthComponent.tsx
import React, { useContext, useEffect, useState } from 'react';
 // Import the AuthContext
import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { useAuth } from '@/app/hooks/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const AuthLogoutComponent = ({message, setMessage}: {message: string, setMessage: React.Dispatch<React.SetStateAction<string>>}) => {
    const { firebaseUser, logout } = useAuth(); // Access user and loading state
    const { setGuestMode } = useAccount();
    const router = useRouter(); // Initialize the router
    // const allowFirebase = process.env.NEXT_PUBLIC_TEST_ENV_KEY;

    const handleLogout = async () => {
        setMessage(``);
        try {
            await logout();
            setMessage("User logged out successfully.");
            setGuestMode(false);
            router.push('/login');
        } catch (error) {
            setMessage("Logout failed. Please try again.");
        }
    };

    return (<>
		<div>
			<p className="text-center">Welcome, {firebaseUser!.email}</p> {/* Display user's email */}
			<button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded w-full hover:bg-red-600">
				Logout
			</button>
		</div>
		{message && <p className="mt-4 text-center text-red-500">{message}</p>}
		</>
    );
};

export default AuthLogoutComponent;