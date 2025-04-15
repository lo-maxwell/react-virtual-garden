// AuthComponent.tsx
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

const AuthCreateAccountComponent: React.FC = () => {
    const { firebaseUser, loading, logout } = useAuth(); // Access user and loading state
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const { user, reloadUser, resetUser } = useUser();
    const { inventory, reloadInventory, resetInventory } = useInventory();
    const { store, reloadStore, resetStore } = useStore();
    const { garden, reloadGarden, resetGarden } = useGarden();
    const { account, guestMode, setGuestMode } = useAccount();
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

    const handleRegister = async () => {
        if (allowFirebase !== 'this is the local environment') {
            setMessage(`Error: Firebase registration is disabled at this time. Please use guest mode instead.`);
            return;
        }
        setMessage(``);
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
			<button onClick={handleRegister} className="bg-blue-500 text-white p-2 rounded w-full mb-2 hover:bg-blue-600">
				Register
			</button>
			<button onClick={handleGoogleLogin} className="bg-yellow-500 text-white p-2 rounded w-full mb-2 hover:bg-yellow-600">
				Create Account with Google
			</button>
			{message && <p className="mt-4 text-center text-red-500">{message}</p>}
		</>
    );
};

export default AuthCreateAccountComponent;