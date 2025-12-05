// AuthComponent.tsx
import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { useGarden } from '@/app/hooks/contexts/GardenContext';
import { useGoose } from '@/app/hooks/contexts/GooseContext';
import { useInventory } from '@/app/hooks/contexts/InventoryContext';
import { useStore } from '@/app/hooks/contexts/StoreContext';
import { useUser } from '@/app/hooks/contexts/UserContext';
import { Garden } from '@/models/garden/Garden';
import GoosePen from '@/models/goose/GoosePen';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { Store } from '@/models/itemStore/store/Store';
import User from '@/models/user/User';
import { saveGarden } from '@/utils/localStorage/garden';
import { saveGoosePen } from '@/utils/localStorage/goose';
import { saveInventory } from '@/utils/localStorage/inventory';
import { saveStore } from '@/utils/localStorage/store';
import { saveUser } from '@/utils/localStorage/user';
import { FirebaseError } from 'firebase/app';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { fetchAccountObjects, loginWithGoogle, registerUser } from './authClientService';
// Import the AuthContext

const AuthCreateAccountComponent = ({message, setMessage}: {message: string; setMessage: React.Dispatch<React.SetStateAction<string>>}) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmedPassword, setConfirmedPassword] = useState<string>('');

    const { reloadUser } = useUser();
    const { reloadInventory } = useInventory();
    const { reloadStore } = useStore();
    const { reloadGarden } = useGarden();
    const { reloadGoosePen } = useGoose();
    const { setGuestMode } = useAccount();

    const syncAccountObjects = useCallback(async () => {
        const result = await fetchAccountObjects();
        if (!result) {
            console.error(`Could not find result of fetchAccountObjects!`);
            return;
        }

        saveUser(User.fromPlainObject(result.plainUserObject));
        saveGarden(Garden.fromPlainObject(result.plainGardenObject));
        saveInventory(Inventory.fromPlainObject(result.plainInventoryObject));
        saveStore(Store.fromPlainObject(result.plainStoreObject));
        saveGoosePen(GoosePen.fromPlainObject(result.plainGoosePenObject));

        reloadUser();
        reloadGarden();
        reloadInventory();
        reloadStore();
        reloadGoosePen();
    }, [reloadUser, reloadGarden, reloadInventory, reloadStore]);

    const handleRegister = useCallback(async () => {
        setMessage('');
        if (password !== confirmedPassword) {
            setMessage('Passwords do not match!');
            return;
        }

        // Password validation
        const minLength = 8;
        const maxLength = 4096;
        let validationMessages: string[] = [];

        if (password.length < minLength) {
            validationMessages.push(
                `Password must be at least ${minLength} characters long.`
            );
        }
        if (password.length > maxLength) {
            validationMessages.push(
                `Password must be at most ${maxLength} characters long.`
            );
        }
        if (!/[a-z]/.test(password)) {
            validationMessages.push('Password must contain at least one lowercase letter.');
        }
        if (!/[A-Z]/.test(password)) {
            validationMessages.push('Password must contain at least one uppercase letter.');
        }
        if (!/\d/.test(password)) {
            validationMessages.push('Password must contain at least one number.');
        }

        if (validationMessages.length > 0) {
            setMessage(validationMessages.join(' '));
            return;
        }

        try {
            const userCredential = await registerUser(email, password);
            setMessage(`User registered: ${userCredential.user.email}`);
            await syncAccountObjects();
            setGuestMode(false);
        } catch (error) {
            if (error instanceof FirebaseError) {
                setMessage('Login failed. Please check your credentials.');
            } else if (
                error instanceof Error &&
                error.message.includes('Failed to fetch /api/auth/getAccountObjects')
            ) {
                setMessage('Unable to connect to database. Please try again later.');
            } else {
                setMessage('There was an unknown error. Try again later.');
            }
        }
    }, [password, confirmedPassword, email, setMessage, syncAccountObjects, setGuestMode]);

    const handleGoogleLogin = useCallback(async () => {
        setMessage('');
        try {
            const userCredential = await loginWithGoogle();
            setMessage(`User logged in with Google: ${userCredential.user.email}`);
            await syncAccountObjects();
            setGuestMode(false);
        } catch (error) {
            if (error instanceof FirebaseError) {
                setMessage('Login failed. Please check your credentials.');
            } else if (
                error instanceof Error &&
                error.message.includes('Failed to fetch /api/auth/getAccountObjects')
            ) {
                setMessage('Unable to connect to database. Please try again later.');
            } else {
                setMessage('There was an unknown error. Try again later.');
            }
        }
    }, [setMessage, syncAccountObjects, setGuestMode]);

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
            <button
                onClick={handleRegister}
                className="bg-blue-500 text-white p-2 rounded w-full mb-2 hover:bg-blue-600"
            >
                Create Account
            </button>
            <button
                onClick={handleGoogleLogin}
                className="bg-yellow-500 text-white p-2 rounded w-full mb-2 hover:bg-yellow-600"
            >
                Create Account with Google
            </button>
            {message && <p className="mt-4 text-center text-red-500">{message}</p>}
        </>
    );
};

export default AuthCreateAccountComponent;