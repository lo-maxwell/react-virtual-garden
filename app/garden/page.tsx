'use client'
import GardenComponent from "./garden";
import UserProfileComponent from "@/components/garden/userProfile";
import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import { useGarden } from "@/app/hooks/contexts/GardenContext";
import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import InventoryComponent from "@/components/inventory/inventory";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { useAuth } from "../hooks/contexts/AuthContext";
import { useAccount } from "../hooks/contexts/AccountContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const GardenPage = () => {
  const { firebaseUser } = useAuth();
  const { guestMode } = useAccount();
  const { user } = useUser();
  const { garden, gardenForceRefreshKey } = useGarden();
  const { inventory, inventoryForceRefreshKey } = useInventory();
  const {selectedItem, toggleSelectedItem} = useSelectedItem();
  const router = useRouter();

  useEffect(() => {
    if (!firebaseUser && !guestMode) {
      router.push('/login');
    }
  }, [firebaseUser, guestMode, router]);

  const RenderUser = () => {
    if (!user) return <div>Loading User...</div>;
    return <UserProfileComponent/>
  }

  const RenderGarden = () => {
    if (!garden || !inventory) return <div>Loading Garden...</div>;
    return <GardenComponent key={gardenForceRefreshKey}/>;
  }

  const RenderInventory = () => {
    if (!inventory) return <div>Loading Inventory...</div>;
    return <InventoryComponent forceRefreshKey={inventoryForceRefreshKey} onInventoryItemClickFunction={toggleSelectedItem} costMultiplier={1}/>;
  }

  return (<>
    <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
      <div className="flex">
        <div className="w-1/4">
          {RenderUser()}
        </div>
        <div className="w-1/2 flex-col">
          {RenderGarden()}
        </div>
        <div className="w-1/4" data-testid="user-inventory">
          {RenderInventory()}
        </div>
      </div>
      
    </div>
    </>
  );
}

export default GardenPage;