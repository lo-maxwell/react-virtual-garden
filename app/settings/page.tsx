'use client'

import { Garden } from '@/models/garden/Garden';
import { Inventory } from '@/models/itemStore/inventory/Inventory';
import { Store } from '@/models/itemStore/store/Store';
import User from '@/models/user/User';
import { saveGarden } from '@/utils/localStorage/garden';
import { saveInventory } from '@/utils/localStorage/inventory';
import { saveStore } from '@/utils/localStorage/store';
import { saveUser } from '@/utils/localStorage/user';
import React, { useCallback, useState } from 'react';
import { useAccount } from '../hooks/contexts/AccountContext';
import { useGarden } from '../hooks/contexts/GardenContext';
import { useInventory } from '../hooks/contexts/InventoryContext';
import { useStore } from '../hooks/contexts/StoreContext';
import { useUser } from '../hooks/contexts/UserContext';
import { useDispatch } from 'react-redux';
import { setItemQuantity } from "@/store/slices/inventoryItemSlice";
import { fetchAccountObjects } from '../login/firebaseAuth/authClientService';
import GoosePen from '@/models/goose/GoosePen';
import { saveGoosePen } from '@/utils/localStorage/goose';
import { useGoose } from '../hooks/contexts/GooseContext';

const SettingsPage: React.FC = () => {

  const { user, reloadUser, resetUser } = useUser();
  const { inventory, reloadInventory, resetInventory } = useInventory();
  const { store, reloadStore, resetStore } = useStore();
  const { garden, reloadGarden, resetGarden } = useGarden();
  const { reloadGoosePen } = useGoose();
  const { account, 
    guestMode, 
    setGuestMode, 
    displayEmojiIcons, 
    setDisplayEmojiIcons, 
    confirmPlantAll,
		setConfirmPlantAll,
		confirmHarvestAll,
		setConfirmHarvestAll,
		confirmPickupAll,
		setConfirmPickupAll,
		confirmDeletePlants,
		setConfirmDeletePlants} = useAccount();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('black');
  const dispatch = useDispatch();

  const syncAccountObjects = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await fetchAccountObjects();
      console.log('result:');
      console.log(result);
      if (!result) {
        console.error(`Could not find result of fetchAccountObjects!`);
        setMessage(`Could not fetch account data! Please refresh the page!`);
        setMessageColor("text-red-400");
        return;
      }

      saveUser(User.fromPlainObject(result.plainUserObject));
      saveGarden(Garden.fromPlainObject(result.plainGardenObject));
      saveInventory(Inventory.fromPlainObject(result.plainInventoryObject));
      saveStore(Store.fromPlainObject(result.plainStoreObject));
      saveGoosePen(GoosePen.fromPlainObject(result.plainGoosePenObject));

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
      reloadGoosePen();
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
  }, [dispatch, reloadUser, reloadGarden, reloadInventory, reloadStore]);

  const getSyncAccountObjectsButtonText = useCallback(() => {
    if (syncing) {
      return "Account syncing in progress..."
    } else {
      return "Force Sync Account"
    }
  }, [syncing]);

  const toggleDisplayEmojiIcons = useCallback(() => {
    if (displayEmojiIcons) {
      setMessage(`Now displaying svg icons. Please refresh the page for changes to take effect.`);
      setMessageColor("text-green-600");
    } else {
      setMessage(`Now displaying emoji icons. Please refresh the page for changes to take effect.`);
      setMessageColor("text-green-600");
    }
    setDisplayEmojiIcons(!displayEmojiIcons);
  }, [displayEmojiIcons]);

  const getToggleDisplayEmojiIconsButtonText = useCallback(() => {
    if (displayEmojiIcons) {
      return "Turn on svg icons";
    } else {
      return "Turn on emoji icons";
    }
  }, [displayEmojiIcons]);

  return (<>
    <div className="flex flex-1 flex-col bg-reno-sand-200 text-black">
      <div className="mx-4">This is the settings page.</div>
      <div className={`mx-4 ${messageColor}`}>{message}</div>
      <div className="mx-4 mt-4">
        <button
          onClick={syncAccountObjects}
          disabled={syncing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {getSyncAccountObjectsButtonText()}
        </button>
      </div>
      <div className="mx-4 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">
            Confirm before planting multiple plants
          </span>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={confirmPlantAll}
              onChange={() => setConfirmPlantAll(!confirmPlantAll)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${confirmPlantAll ? 'bg-green-600' : 'bg-gray-200'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${confirmPlantAll ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </div>
          </label>
        </div>
      </div>

      <div className="mx-4 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">
            Confirm before harvesting all plants
          </span>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={confirmHarvestAll}
              onChange={() => setConfirmHarvestAll(!confirmHarvestAll)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${confirmHarvestAll ? 'bg-green-600' : 'bg-gray-200'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${confirmHarvestAll ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </div>
          </label>
        </div>
      </div>

      <div className="mx-4 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">
            Confirm before picking up all decorations
          </span>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={confirmPickupAll}
              onChange={() => setConfirmPickupAll(!confirmPickupAll)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${confirmPickupAll ? 'bg-green-600' : 'bg-gray-200'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${confirmPickupAll ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </div>
          </label>
        </div>
      </div>

      <div className="mx-4 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">
            Confirm before destroying plants
          </span>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={confirmDeletePlants}
              onChange={() => setConfirmDeletePlants(!confirmDeletePlants)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${confirmDeletePlants ? 'bg-green-600' : 'bg-gray-200'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${confirmDeletePlants ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </div>
          </label>
        </div>
      </div>
      {/* <button onClick={toggleDisplayEmojiIcons} disabled={syncing} className="block w-full text-left py-2 px-4 hover:bg-[#d0cecc] whitespace-nowrap">{getToggleDisplayEmojiIconsButtonText()}</button> */}
    </div>
  </>
  );
}

export default SettingsPage;