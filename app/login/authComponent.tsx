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
import AuthLogoutComponent from './authLogoutComponent';
import AuthLoginComponent from './authLoginComponent';
import AuthCreateAccountComponent from './authCreateAccountComponent';

const AuthComponent: React.FC = () => {
    const { firebaseUser, loading, logout } = useAuth(); // Access user and loading state
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [displayLogin, setDisplayLogin] = useState<boolean>(true);
    const { user, reloadUser, resetUser } = useUser();
    const { inventory, reloadInventory, resetInventory } = useInventory();
    const { store, reloadStore, resetStore } = useStore();
    const { garden, reloadGarden, resetGarden } = useGarden();
    const { account, guestMode, setGuestMode } = useAccount();
    const allowFirebase = process.env.NEXT_PUBLIC_TEST_ENV_KEY;

    const syncAccountObjects = async () => {
        const result = await fetchAccountObjects();
        console.log('result:');
        console.log(result);
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

    const handleLogout = async () => {
        setMessage(``);
        try {
            await logout();
            setMessage("User logged out successfully.");
            setGuestMode(false);
        } catch (error) {
            setMessage("Logout failed. Please try again.");
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

    const printCustomClaims = async () => {
        await getUserCustomClaims();
    }

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

    const toggleDisplayLogin = (newValue: boolean | null = null) => {
        if (typeof newValue == "boolean" && displayLogin !== newValue) {
            setDisplayLogin(newValue);
        } else {
            setDisplayLogin(displayLogin => !displayLogin);
        }
    }

    if (loading) {
        return <p>Loading...</p>; // Show a loading message while checking auth state
    }

    return (
        <div className="flex items-center justify-center py-8">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4 text-center">Sign in to Virtual Garden</h2>
                {firebaseUser ? (
                    <AuthLogoutComponent></AuthLogoutComponent>
                ) : (
                    <>
                    <div className="flex justify-center space-x-4 mb-2"> {/* Added mb-2 for vertical gap */}
                        <button 
                            onClick={() => toggleDisplayLogin(true)} 
                            className={`w-32 px-4 py-2 rounded border border-gray-400 ${displayLogin ? 'bg-green-500 text-white cursor-default' : 'bg-white'}`} // Tailwind classes for styling
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => toggleDisplayLogin(false)} 
                            className={`w-32 px-4 py-2 rounded border border-gray-400 ${!displayLogin ? 'bg-blue-500 text-white cursor-default' : 'bg-white'}`} // Tailwind classes for styling
                        >
                            Register
                        </button>
                    </div>
                    {displayLogin ? (
                        <AuthLoginComponent></AuthLoginComponent>
                    ) : (
                        <AuthCreateAccountComponent></AuthCreateAccountComponent>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthComponent;