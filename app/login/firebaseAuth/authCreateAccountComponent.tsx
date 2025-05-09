// AuthComponent.tsx
import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { useAuth } from '@/app/hooks/contexts/AuthContext';
import { useGarden } from '@/app/hooks/contexts/GardenContext';
import { useInventory } from '@/app/hooks/contexts/InventoryContext';
import { useStore } from '@/app/hooks/contexts/StoreContext';
import { useUser } from '@/app/hooks/contexts/UserContext';
import { Garden } from '@/models/garden/Garden';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { Store } from '@/models/itemStore/store/Store';
import User from '@/models/user/User';
import { saveGarden } from '@/utils/localStorage/garden';
import { saveInventory } from '@/utils/localStorage/inventory';
import { saveStore } from '@/utils/localStorage/store';
import { saveUser } from '@/utils/localStorage/user';
import React, { useContext, useEffect, useState } from 'react';
 // Import the AuthContext
import { registerUser, loginUser, logoutUser, loginWithGoogle, getUserCustomClaims, fetchAccountObjects } from './authClientService';

const AuthCreateAccountComponent: React.FC = () => {
    const { firebaseUser, loading, logout } = useAuth(); // Access user and loading state
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmedPassword, setConfirmedPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const { user, reloadUser, resetUser } = useUser();
    const { inventory, reloadInventory, resetInventory } = useInventory();
    const { store, reloadStore, resetStore } = useStore();
    const { garden, reloadGarden, resetGarden } = useGarden();
    const { account, guestMode, setGuestMode } = useAccount();
    // const allowFirebase = process.env.NEXT_PUBLIC_TEST_ENV_KEY;

    const syncAccountObjects = async () => {
        const result = await fetchAccountObjects();
        if (!result) {
            console.error(`Could not find result of fetchAccountObjects!`);
        }

        saveUser(User.fromPlainObject(result.plainUserObject));
        saveGarden(Garden.fromPlainObject(result.plainGardenObject));
        saveInventory(Inventory.fromPlainObject(result.plainInventoryObject));
        saveStore(Store.fromPlainObject(result.plainStoreObject));
        reloadUser();
        reloadGarden();
        reloadInventory();
        reloadStore();
    }

    // ... existing code ...
    const handleRegister = async () => {
        // if (allowFirebase !== 'this is the local environment') {
        //     setMessage(`Error: Firebase registration is disabled at this time. Please use guest mode instead.`);
        //     return;
        // }
        setMessage(``);
        if (password !== confirmedPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        // Password validation
        const minLength = 10;
        const maxLength = 4096;
        let validationMessages = [];

        if (password.length < minLength) {
            validationMessages.push(`Password must be at least ${minLength} characters long.`);
        }
        if (password.length > maxLength) {
            validationMessages.push(`Password must be at most ${maxLength} characters long.`);
        }
        if (!/[a-z]/.test(password)) {
            validationMessages.push("Password must contain at least one lowercase letter.");
        }
        if (!/[A-Z]/.test(password)) {
            validationMessages.push("Password must contain at least one uppercase letter.");
        }
        if (!/\d/.test(password)) {
            validationMessages.push("Password must contain at least one number.");
        }

        if (validationMessages.length > 0) {
            setMessage(validationMessages.join(" "));
            return;
        }

        try {
            const userCredential = await registerUser(email, password);
            setMessage(`User registered: ${userCredential.user.email}`);
            syncAccountObjects();
            setGuestMode(false);
        } catch (error) {
            setMessage("Registration failed. Please try again.");
        }
    };

    const handleGoogleLogin = async () => {
        // if (allowFirebase !== 'this is the local environment') {
        //     setMessage(`Error: Firebase login is disabled at this time. Please use guest mode instead.`);
        //     return;
        // }
        setMessage(``);
        try {
            const userCredential = await loginWithGoogle();
            setMessage(`User logged in with Google: ${userCredential.user.email}`);
            syncAccountObjects();
            setGuestMode(false);
        } catch (error) {
            setMessage("Google login failed. Please try again.");
        }
    };


    return (
		<>
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
				className="border border-gray-300 p-2 mb-4 w-full rounded"
			/>
			<input
				type="password"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
				className="border border-gray-300 p-2 mb-4 w-full rounded"
			/>
			<input
				type="password"
				placeholder="Confirm Password"
				value={confirmedPassword}
				onChange={(e) => setConfirmedPassword((e.target as HTMLInputElement).value)}
				className="border border-gray-300 p-2 mb-4 w-full rounded"
			/>
			<button onClick={handleRegister} className="bg-blue-500 text-white p-2 rounded w-full mb-2 hover:bg-blue-600">
				Create Account
			</button>
			<button onClick={handleGoogleLogin} className="bg-yellow-500 text-white p-2 rounded w-full mb-2 hover:bg-yellow-600">
				Create Account with Google
			</button>
			{message && <p className="mt-4 text-center text-red-500">{message}</p>}
		</>
    );
};

export default AuthCreateAccountComponent;