'use client'
import InventoryComponent from "@/components/inventory/inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { loadGarden, saveGarden } from "@/utils/localStorage/garden";
import { loadInventory, saveInventory } from "@/utils/localStorage/inventory";
import { useEffect, useState } from "react";
import GardenComponent from "./garden";
import User from "@/models/user/User";
import UserProfileComponent from "@/components/garden/userProfile";
import { useInventory } from "@/hooks/contexts/InventoryContext";
import { useGarden } from "@/hooks/contexts/GardenContext";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";


const GardenPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const { garden, resetGarden } = useGarden();
  const { inventory, resetInventory } = useInventory();
  //Hack to force refresh inventory when its contents change in another component
  const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);
  //Hack to force refresh garden when its contents change in another component
  const [gardenForceRefreshKey, setGardenForceRefreshKey] = useState(0);

  const [selected, setSelected] = useState<InventoryItem | null>(null);

  function printGarden() {
    if (!garden || !inventory) return;
    console.log(garden.getPlots());
    console.log(inventory.getAllItems());
  }

  function addAppleSeed() {
    if (!inventory) return;
    const appleSeedTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('apple seed');
    inventory.gainItem(appleSeedTemplate!, 10);
    setSelected(inventory.getItem('apple seed').payload);
    setInventoryForceRefreshKey(inventoryForceRefreshKey + 1);
    saveInventory(inventory);
  }

  function RenderUser() {
    if (!user) return <div>Still in development...</div>;
    return <UserProfileComponent/>
  }

  function RenderGarden() {
    if (!garden || !inventory) return <div>Loading Garden...</div>;
    return <GardenComponent key={gardenForceRefreshKey} selected={selected} setSelected={setSelected} inventoryForceRefresh={{value: inventoryForceRefreshKey, setter: setInventoryForceRefreshKey}}/>;
  }

  function RenderInventory() {
    if (!inventory) return <div>Loading Inventory...</div>;
    return <InventoryComponent key={inventoryForceRefreshKey} onInventoryItemClickFunction={setSelected} costMultiplier={1}/>;
  }

  function handleResetGarden() {
    if (!garden) return;
    resetGarden();
    setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
  }

  return (<>
    <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
      <div> 
        This is the Garden Page!
      </div>
      <div className="flex">
        <div className="w-1/4">
          {RenderUser()}
        </div>
        <div className="w-1/2 flex-col">
          {RenderGarden()}
        </div>
        <div className="w-1/4">
          {RenderInventory()}
        </div>
      </div>

      <div>
        <button onClick={printGarden} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>print garden</button>
      </div>
      <div>
        <button onClick={addAppleSeed} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>gain apple seed</button>
      </div>
      <div>
      <button onClick={resetInventory} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>reset inventory (debug)</button>
      </div>
      <div>
      <button onClick={handleResetGarden} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>reset garden (debug)</button>
      </div>
      
    </div>
    </>
  );
}

export default GardenPage;