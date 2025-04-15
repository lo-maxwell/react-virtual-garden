// AuthLoginComponent.tsx
import React, { useContext, useEffect, useState } from 'react';
 // Import the AuthContext
import { registerUser, loginUser, logoutUser, loginWithGoogle, getUserCustomClaims, fetchAccountObjects } from './authClientService';
import { useAuth } from '../hooks/contexts/AuthContext';
import { Garden } from '@/models/garden/Garden';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { Store } from '@/models/itemStore/store/Store';
import User from '@/models/user/User';
import { saveGarden } from '@/utils/localStorage/garden';
import { saveInventory } from '@/utils/localStorage/inventory';
import { saveStore } from '@/utils/localStorage/store';
import { saveUser } from '@/utils/localStorage/user';
import { useUser } from '../hooks/contexts/UserContext';
import { useInventory } from '../hooks/contexts/InventoryContext';
import { useGarden } from '../hooks/contexts/GardenContext';
import { useStore } from '../hooks/contexts/StoreContext';
import { useAccount } from '../hooks/contexts/AccountContext';

const AuthLoginComponent: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const { reloadUser, resetUser } = useUser();
    const { reloadInventory, resetInventory } = useInventory();
    const { reloadStore, resetStore } = useStore();
    const { reloadGarden, resetGarden } = useGarden();
    const { guestMode, setGuestMode } = useAccount();
    const allowFirebase = process.env.NEXT_PUBLIC_TEST_ENV_KEY;

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

    const handleLogin = async () => {
        if (allowFirebase !== 'this is the local environment') {
            setMessage(`Error: Firebase login is disabled at this time. Please use guest mode instead.`);
            return;
        }
        setMessage(``);
        try {
            const userCredential = await loginUser(email, password);
            setMessage(`User logged in: ${userCredential.user.email}`);
            syncAccountObjects();
            setGuestMode(false);
        } catch (error) {
            setMessage("Login failed. Please check your credentials.");
        }
    };

    const handleGoogleLogin = async () => {
        if (allowFirebase !== 'this is the local environment') {
            setMessage(`Error: Firebase login is disabled at this time. Please use guest mode instead.`);
            return;
        }
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

    const enterGuestMode = () => {
        if (guestMode) {
            setMessage("You are already in guest mode. Local data will be deleted upon registration or login.");
            return;
        }
        resetUser();
        resetGarden();
        resetStore();
        resetInventory();
        setGuestMode(true);
        setMessage("Entered guest mode. Local data will be deleted upon registration or login.");
    }

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
			<button onClick={handleLogin} className="bg-green-500 text-white p-2 rounded w-full mb-2 hover:bg-green-600">
				Login
			</button>
			<button onClick={handleGoogleLogin} className="bg-yellow-500 text-white p-2 rounded w-full mb-2 hover:bg-yellow-600">
				Login with Google
			</button>
			<button onClick={enterGuestMode} className="bg-red-500 text-white p-2 rounded w-full hover:bg-red-600">
				{guestMode ? 'Guest Mode is currently On' : 'Enter as Guest'}
			</button>
        	{message && <p className="mt-4 text-center text-red-500">{message}</p>}
		</>
	);
};

export default AuthLoginComponent;