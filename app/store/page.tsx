'use client'
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { useEffect, useState } from "react";
import StoreComponent from "./store";
import { Store } from "@/models/itemStore/store/Store";
import TradeWindowComponent from "./tradeWindow/tradeWindow";
import { useStore } from "@/app/hooks/contexts/StoreContext";
import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import InventoryComponent from "@/components/inventory/inventory";
import { useAuth } from "../hooks/contexts/AuthContext";
import { useAccount } from "../hooks/contexts/AccountContext";
import { useRouter } from "next/navigation";
import RedirectingMessage from "@/components/errorPages/redirectingMessage";

const StorePage = () => {
  const RenderStore = () => {
    const { firebaseUser } = useAuth();
    const { guestMode } = useAccount();
    const {store} = useStore();
    const { inventory } = useInventory();
    const {selectedItem, toggleSelectedItem, owner, setOwner} = useSelectedItem();
    // forceRefreshKey is supposed to help with resyncing store/inventory, but it doesn't work right now
    const [forceRefreshKey, setForceRefreshKey] = useState(0);
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
      if (!firebaseUser && !guestMode) {
        setIsRedirecting(true); // Trigger the redirecting state
  
        // Delay the redirect by 2 seconds (adjust the time as needed)
        const timer = setTimeout(() => {
          router.push('/login');
        }, 2000); // 2 seconds delay before redirecting
  
        return () => clearTimeout(timer); // Cleanup the timer if the component is unmounted or the condition changes
      }
    }, [firebaseUser, guestMode, router]);
  
    // Show the redirecting message if needed
    if ((!firebaseUser && !guestMode) || isRedirecting) {
      return <RedirectingMessage targetPage="login page"/>;
    }

    const inventorySetSelected = (arg: InventoryItem | null) => {
      setOwner(inventory);
      toggleSelectedItem(arg);
    }

    const tradeWindowSetSelected = (arg: InventoryItem | null) => {
      setOwner(null);
      toggleSelectedItem(arg);
    }

    const storeSetSelected = (arg: InventoryItem | null) => {
      setOwner(store);
      toggleSelectedItem(arg);
    }

    const findStoreComponent = () => {
      if (!store) return <div>Loading Store...</div>;
      return <StoreComponent onInventoryItemClickFunction={storeSetSelected} forceRefreshKey={forceRefreshKey}/>;
    }

    const findTradeWindowComponent = () => {
      if (!inventory || !store) return <div>Loading Trade Window...</div>;
      return <TradeWindowComponent costMultiplier={getCostMultiplier()} forceRefreshKey={forceRefreshKey} setForceRefreshKey={setForceRefreshKey}/>;
    }

    const findInventoryComponent = () => {
      if (!inventory || !store) return <div>Loading Inventory...</div>;
      return <>
        <div className="w-[80%]">
          <InventoryComponent onInventoryItemClickFunction={inventorySetSelected} costMultiplier={store.getSellMultiplier()} forceRefreshKey={forceRefreshKey}/>
        </div>
      </>
    }

    const getCostMultiplier = () => {
      if (store && inventory && owner instanceof Inventory) {
        return store.getSellMultiplier();
      } else if (store && owner instanceof Store) {
        return store.getBuyMultiplier();
      } else {
        return 1;
      }
    }

    return <>
    <div className="flex ">
      <div className="w-1/3 flex justify-center">
        {findStoreComponent()}
      </div>
      <div className="w-1/3 flex flex-col">
        {findTradeWindowComponent()}
      </div>
      <div className="w-1/3 flex justify-center">
        {findInventoryComponent()}
      </div>
    </div>
    </>
  }

  return (<>
    <div className="w-full px-4 py-4 bg-reno-sand-200 text-black"> 
      {RenderStore()}
    </div>
    </>
  );
}

export default StorePage;