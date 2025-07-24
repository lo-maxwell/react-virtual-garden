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
import { useDispatch } from 'react-redux';
import { setItemQuantity } from "@/store/slices/inventoryItemSlice";
import { fetchAccountObjects } from '../login/firebaseAuth/authClientService';

const LoginPage: React.FC = () => {

	const { user, reloadUser, resetUser } = useUser();
  const { inventory, reloadInventory, resetInventory } = useInventory();
  const { store, reloadStore, resetStore } = useStore();
  const { garden, reloadGarden, resetGarden } = useGarden();
  const { account, guestMode, setGuestMode, displayEmojiIcons, setDisplayEmojiIcons } = useAccount();
	const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('black');
	const dispatch = useDispatch();

    const syncAccountObjects = async () => {
		    setSyncing(true);
        try {
        const result = await fetchAccountObjects();
        console.log('result:');
        console.log(result);
        if (!result) {
          console.error(`Could not find result of fetchAccountObjects!`);
          setMessage(`Could not fetch account data! Please refresh the page!`);
          setMessageColor("red-400");
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
        setMessage(`Successfully loaded account data.`);
        setMessageColor("text-green-600");
        } catch {
          console.error(`Could not find result of fetchAccountObjects!`);
          setMessage(`Could not fetch account data! Please refresh the page!`);
          setMessageColor("text-red-600");
			    return;
        } finally {
          setTimeout(() => {
            setSyncing(false);
          }, 1000);
        }
    }

	function getSyncAccountObjectsButtonText () {
		if (syncing) {
			return "Account syncing in progress..."
		} else {
			return "Force Sync Account"
		}
	}

  function toggleDisplayEmojiIcons () {
    if (displayEmojiIcons) {
      setMessage(`Now displaying svg icons. Please refresh the page for changes to take effect.`);
      setMessageColor("text-green-600");
    } else {
      setMessage(`Now displaying emoji icons. Please refresh the page for changes to take effect.`);
      setMessageColor("text-green-600");
    }
    setDisplayEmojiIcons(!displayEmojiIcons);
  }

  function getToggleDisplayEmojiIconsButtonText () {
    if (displayEmojiIcons) {
      return "Turn on svg icons";
    } else {
      return "Turn on emoji icons";
    }
  }
  
  return (<>
      <div className="flex flex-1 flex-col bg-reno-sand-200 text-black"> 
        <div className="mx-4">This is the settings page.</div>
        <div className={`mx-4 ${messageColor}`}>{message}</div>
		    <button onClick={syncAccountObjects} disabled={syncing} className="block w-full text-left py-2 px-4 hover:bg-[#d0cecc] whitespace-nowrap">{getSyncAccountObjectsButtonText()}</button>
        <button onClick={toggleDisplayEmojiIcons} disabled={syncing} className="block w-full text-left py-2 px-4 hover:bg-[#d0cecc] whitespace-nowrap">{getToggleDisplayEmojiIconsButtonText()}</button>
      </div>
    </>
  );
}

export default LoginPage;