"use client";
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
import { useCallback, useEffect, useState } from "react";
import RedirectingMessage from "@/components/errorPages/redirectingMessage";
import "./page.css";
import GardenDebugOptions from "@/components/developer/GardenDebugOptions";
import BottomLeftNotificationPanel from "@/components/notifications/NotificationPanel";

const GardenPageClient = ({ showDeveloperOptions = false }: { showDeveloperOptions: boolean }) => {
  const { firebaseUser } = useAuth();
  const { guestMode } = useAccount();
  const { user } = useUser();
  const { garden, gardenForceRefreshKey } = useGarden();
  const { inventory, inventoryForceRefreshKey } = useInventory();
  const { selectedItem, toggleSelectedItem } = useSelectedItem();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!firebaseUser && !guestMode) {
      setIsRedirecting(true); // Trigger the redirecting state

      // Delay the redirect by 2 seconds (adjust the time as needed)
      const timer = setTimeout(() => {
        router.push("/login");
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
      redirectDivElement = <RedirectingMessage targetPage="login page" />;
    } else {
      redirectDivElement = <div>{`Fetching user data...`}</div>;
    }

    return (
      <>
        <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
          {redirectDivElement}
        </div>
      </>
    );
  }

  // ✅ Simpler approach - just use regular functions
  const RenderUser = () => {
    if (!user) return <div>Loading User...</div>;
    return <UserProfileComponent />;
  };

  const RenderGarden = () => {
    if (!garden || !inventory) return <div>Loading Garden...</div>;
    return <GardenComponent key={gardenForceRefreshKey} />;
  };

  const RenderInventory = () => {
    if (!inventory) return <div>Loading Inventory...</div>;
    return (
      <>
      <InventoryComponent
        forceRefreshKey={inventoryForceRefreshKey}
        onInventoryItemClickFunction={toggleSelectedItem}
        costMultiplier={1}
      />
      {showDeveloperOptions && <GardenDebugOptions />}
      </>
    );
  };

  return (
    <div className="layout-wrapper w-full px-4 py-4 bg-reno-sand-200 text-black relative pb-16">
      <div className="flex w-full gap-4 layout-row">
        {/* Left column: user on top of garden */}
        <div className="flex-1 flex flex-col gap-4">
          <div>{RenderUser()}</div>
          <div>{RenderGarden()}</div>
        </div>

        {/* Right column: inventory (30% width) */}
        <div className="w-3/10 min-w-[300px]" data-testid="user-inventory">
          {RenderInventory()}
        </div>
      </div>
      <BottomLeftNotificationPanel/>
    </div>
  );
};

export default GardenPageClient;
