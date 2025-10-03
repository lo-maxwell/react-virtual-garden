// AuthLoginComponent.tsx
import React, { useCallback, useContext, useEffect, useState } from 'react';
// Import the AuthContext
import { registerUser, loginUser, logoutUser, loginWithGoogle, getUserCustomClaims, fetchAccountObjects, sendResetPassword } from './authClientService';
import { Garden } from '@/models/garden/Garden';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { Store } from '@/models/itemStore/store/Store';
import User from '@/models/user/User';
import { saveGarden } from '@/utils/localStorage/garden';
import { saveInventory } from '@/utils/localStorage/inventory';
import { saveStore } from '@/utils/localStorage/store';
import { saveUser } from '@/utils/localStorage/user';
import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { useGarden } from '@/app/hooks/contexts/GardenContext';
import { useInventory } from '@/app/hooks/contexts/InventoryContext';
import { useUser } from '@/app/hooks/contexts/UserContext';
import { useStore } from '@/app/hooks/contexts/StoreContext';
import { FirebaseError } from 'firebase/app';

const AuthLoginComponent = ({message, setMessage}: {message: string; setMessage: React.Dispatch<React.SetStateAction<string>>}) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const { reloadUser, resetUser } = useUser();
    const { reloadInventory, resetInventory } = useInventory();
    const { reloadStore, resetStore } = useStore();
    const { reloadGarden, resetGarden } = useGarden();
    const { guestMode, setGuestMode } = useAccount();
    const [allowPasswordReset, setAllowPasswordReset] = useState<boolean>(true);

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

        reloadUser();
        reloadGarden();
        reloadInventory();
        reloadStore();
    }, [reloadUser, reloadGarden, reloadInventory, reloadStore]);

    const handleLogin = useCallback(async () => {
        setMessage('');
        try {
            const userCredential = await loginUser(email, password);
            setMessage(`User logged in: ${userCredential.user.email}`);
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
    }, [email, password, setMessage, syncAccountObjects, setGuestMode]);

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

    const handleSendPasswordReset = useCallback(async () => {
        if (!email) {
            setMessage('Please enter your email first.');
            return;
        }
        setMessage('');
        try {
            await sendResetPassword(email);
            setAllowPasswordReset(false);
            setTimeout(() => {
                setAllowPasswordReset(true);
            }, 10000);
            setMessage(`Sent password reset email to ${email}.`);
        } catch {
            setMessage('Failed to send password reset email. Please try again.');
        }
    }, [email, setMessage]);

    const enterGuestMode = useCallback(() => {
        if (guestMode) {
            setMessage(
                'You are already in guest mode. Local data will be deleted upon registration or login.'
            );
            return;
        }
        resetUser();
        resetGarden();
        resetStore();
        resetInventory();
        setGuestMode(true);
        setMessage(
            'Entered guest mode. Local data will be deleted upon registration or login.'
        );
    }, [
        guestMode,
        setMessage,
        resetUser,
        resetGarden,
        resetStore,
        resetInventory,
        setGuestMode,
    ]);

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
            <button
                onClick={handleLogin}
                className="bg-green-500 text-white p-2 rounded w-full mb-2 hover:bg-green-600"
            >
                Login
            </button>
            <button
                onClick={handleGoogleLogin}
                className="bg-yellow-500 text-white p-2 rounded w-full mb-2 hover:bg-yellow-600"
            >
                Login with Google
            </button>
            <button
                onClick={handleSendPasswordReset}
                disabled={!allowPasswordReset}
                className={`bg-orange-500 text-white p-2 rounded w-full mb-2 ${!allowPasswordReset
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'hover:bg-yellow-600'
                    }`}
            >
                Forgot Password
            </button>
            <button
                onClick={enterGuestMode}
                className="bg-red-500 text-white p-2 rounded w-full hover:bg-red-600"
            >
                {guestMode ? 'Guest Mode is currently On' : 'Enter as Guest'}
            </button>
            {message && <p className="mt-4 text-center text-red-500">{message}</p>}
        </>
    );
};

export default AuthLoginComponent;