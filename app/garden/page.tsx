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
import RedirectingMessage from "@/components/errorPages/redirectingMessage";

const GardenPage = () => {
  const { firebaseUser } = useAuth();
  const { guestMode } = useAccount();
  const { user } = useUser();
  const { garden, gardenForceRefreshKey } = useGarden();
  const { inventory, inventoryForceRefreshKey } = useInventory();
  const {selectedItem, toggleSelectedItem} = useSelectedItem();
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
    } else {
      setIsRedirecting(false);
    }
  }, [firebaseUser, guestMode, router]);

  // Show the redirecting message if needed
  if (!firebaseUser && !guestMode) {
    let redirectDivElement;
    if (isRedirecting) {
      redirectDivElement = <RedirectingMessage targetPage="login page"/>;
    } else {
      redirectDivElement = <div>{`Fetching user data...`}</div>;
    }

    return (<>
      <div className="w-full px-4 py-4 bg-reno-sand-200 text-black"> 
          {redirectDivElement}
      </div>
      </>
    );
  }

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
    <div className="w-full px-4 py-4 bg-reno-sand-200 text-black relative">
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