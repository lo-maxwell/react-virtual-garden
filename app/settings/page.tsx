'use client'

import { Garden } from '@/models/garden/Garden';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { Store } from '@/models/itemStore/store/Store';
import User from '@/models/user/User';
import { saveGarden } from '@/utils/localStorage/garden';
import { saveInventory } from '@/utils/localStorage/inventory';
import { saveStore } from '@/utils/localStorage/store';
import { saveUser } from '@/utils/localStorage/user';
import React, { useState } from 'react';
import { useAccount } from '../hooks/contexts/AccountContext';
import { useGarden } from '../hooks/contexts/GardenContext';
import { useInventory } from '../hooks/contexts/InventoryContext';
import { useStore } from '../hooks/contexts/StoreContext';
import { useUser } from '../hooks/contexts/UserContext';
import { fetchAccountObjects } from '../login/authClientService';
import { useDispatch } from 'react-redux';
import { setItemQuantity } from "@/store/slices/inventoryItemSlice";

const LoginPage: React.FC = () => {

	const { user, reloadUser, resetUser } = useUser();
    const { inventory, reloadInventory, resetInventory } = useInventory();
    const { store, reloadStore, resetStore } = useStore();
    const { garden, reloadGarden, resetGarden } = useGarden();
    const { account, guestMode, setGuestMode } = useAccount();
	const [syncing, setSyncing] = useState(false);
	const dispatch = useDispatch();

    const syncAccountObjects = async () => {
		setSyncing(true);
        const result = await fetchAccountObjects();
        console.log('result:');
        console.log(result);
        if (!result) {
          console.error(`Could not find result of fetchAccountObjects!`);
			    return;
        }

        saveUser(User.fromPlainObject(result.plainUserObject));
        saveGarden(Garden.fromPlainObject(result.plainGardenObject));
        saveInventory(Inventory.fromPlainObject(result.plainInventoryObject));
        saveStore(Store.fromPlainObject(result.plainStoreObject));
        
        const updatedInventory = Inventory.fromPlainObject(result.plainInventoryObject);
        updatedInventory.getAllItems().forEach(item => {
            dispatch(setItemQuantity({ 
                inventoryItemId: item.getInventoryItemId(), 
                quantity: item.getQuantity()
            }));
        });

        reloadUser();
        reloadGarden();
        reloadInventory();
        reloadStore();
		setTimeout(() => {
			setSyncing(false);
		}, 1000);
    }

	function getSyncAccountObjectsButtonText () {
		if (syncing) {
			return "Account syncing in progress..."
		} else {
			return "Force Sync Account"
		}
	}
  
  return (<>
      <div className="flex flex-1 flex-col bg-reno-sand-200 text-black"> 
        <div className="mx-4">This is the settings page.</div>
		<button onClick={syncAccountObjects} disabled={syncing} className="block w-full text-left py-2 px-4 hover:bg-[#d0cecc] whitespace-nowrap">{getSyncAccountObjectsButtonText()}</button>
      </div>
    </>
  );
}

export default LoginPage;