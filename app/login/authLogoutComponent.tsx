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

const AuthLogoutComponent: React.FC = () => {
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