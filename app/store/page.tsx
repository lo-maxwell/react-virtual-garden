"use client";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import "./page.css";

const StorePage = () => {
  const { firebaseUser } = useAuth();
  const { guestMode } = useAccount();
  const { store } = useStore();
  const { inventory } = useInventory();
  const { toggleSelectedItem, setOwner, owner } = useSelectedItem();

  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // Redirect effect
  useEffect(() => {
    if (!firebaseUser && !guestMode) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsRedirecting(false);
    }
  }, [firebaseUser, guestMode, router]);

  // Selection handlers
  const inventorySetSelected = useCallback(
    (arg: InventoryItem | null) => {
      if (!inventory) return;
      setOwner(inventory);
      toggleSelectedItem(arg);
    },
    [inventory, setOwner, toggleSelectedItem]
  );

  const tradeWindowSetSelected = useCallback(
    (arg: InventoryItem | null) => {
      setOwner(null);
      toggleSelectedItem(arg);
    },
    [setOwner, toggleSelectedItem]
  );

  const storeSetSelected = useCallback(
    (arg: InventoryItem | null) => {
      if (!store) return;
      setOwner(store);
      toggleSelectedItem(arg);
    },
    [store, setOwner, toggleSelectedItem]
  );

  // Cost multiplier (memoized)
  const costMultiplier = useMemo(() => {
    if (store && inventory && owner instanceof Inventory) {
      return store.getSellMultiplier();
    } else if (store && owner instanceof Store) {
      return store.getBuyMultiplier();
    }
    return 1;
  }, [store, inventory, owner]);

  // Components (memoized)
  const storeComponent = useMemo(() => {
    if (!store) return <div>Loading Store...</div>;
    return (
      <StoreComponent
        onInventoryItemClickFunction={storeSetSelected}
        forceRefreshKey={forceRefreshKey}
      />
    );
  }, [store, storeSetSelected, forceRefreshKey]);

  const tradeWindowComponent = useMemo(() => {
    if (!inventory || !store) return <div>Loading Trade Window...</div>;
    return (
      <TradeWindowComponent
        costMultiplier={costMultiplier}
        forceRefreshKey={forceRefreshKey}
        setForceRefreshKey={setForceRefreshKey}
      />
    );
  }, [inventory, store, costMultiplier, forceRefreshKey]);

  const inventoryComponent = useMemo(() => {
    if (!inventory || !store) return <div>Loading Inventory...</div>;
    return (
      <div className="w-[80%]">
        <InventoryComponent
          onInventoryItemClickFunction={inventorySetSelected}
          costMultiplier={store.getSellMultiplier()}
          forceRefreshKey={forceRefreshKey}
        />
      </div>
    );
  }, [inventory, store, inventorySetSelected, forceRefreshKey]);

  // Early redirect UI
  if (!firebaseUser && !guestMode) {
    return (
      <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
        {isRedirecting ? (
          <RedirectingMessage targetPage="login page" />
        ) : (
          <div>{`Fetching user data...`}</div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
      <div className="flex storeContainer">
        <div className="w-1/3 flex justify-center section">{storeComponent}</div>
        <div className="w-1/3 flex flex-col section">{tradeWindowComponent}</div>
        <div className="w-1/3 flex justify-center section">
          {inventoryComponent}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
