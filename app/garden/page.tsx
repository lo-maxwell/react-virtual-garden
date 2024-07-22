'use client'
import InventoryComponent from "@/components/inventory/inventory";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemTemplate, PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { loadGarden, saveGarden } from "@/utils/localStorage/garden";
import { loadInventory, saveInventory } from "@/utils/localStorage/inventory";
import { useEffect, useState } from "react";
import GardenComponent from "./garden";


const GardenPage = () => {
  const [garden, setGarden] = useState<Garden | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  //Hack to force refresh inventory when its contents change in another component
  const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);

  function setupInventory(userId: string): Inventory {
    let inv = loadInventory();
    console.log(inv);
    if (!(inv instanceof Inventory)) {
      console.log('inventory not found, setting up');
      inv = new Inventory(userId, 100, new ItemList([
        generateNewPlaceholderInventoryItem('appleSeed', 10), 
        generateNewPlaceholderInventoryItem('benchBlueprint', 5), 
        generateNewPlaceholderInventoryItem('bananaSeed', 10), 
        generateNewPlaceholderInventoryItem('coconutSeed', 25)]));
      saveInventory(inv);
    }
    return inv;
  }
  
  useEffect(() => {
    const inv = setupInventory("Test User");
    setInventory(inv);
  }, []);

  function setupGarden(userId: string, rows: number, cols: number): Garden {
    let garden = loadGarden();
    console.log(garden);
    if (!(garden instanceof Garden)) {
      console.log('garden not found, setting up');
      garden = new Garden(userId, rows, cols);
      saveGarden(garden);
    }
    return garden;
  }
  
  useEffect(() => {
    const garden = setupGarden("Test User", 6, 6);
    setGarden(garden);
  }, []);

  const [selected, setSelected] = useState<InventoryItem | null>(null);

  function printGarden() {
    if (!garden || !inventory) return;
    console.log(garden.getPlots());
    console.log(inventory.getAllItems());
  }

  function addAppleSeed() {
    if (!inventory) return;
    inventory.gainItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 10);
    setSelected(inventory.getItem('apple seed').payload);
    setInventoryForceRefreshKey(inventoryForceRefreshKey + 1);
    saveInventory(inventory);
  }

  function resetInventory() {
    const inv = new Inventory("Test User", 100, new ItemList([
      generateNewPlaceholderInventoryItem('appleSeed', 10), 
      generateNewPlaceholderInventoryItem('benchBlueprint', 5), 
      generateNewPlaceholderInventoryItem('bananaSeed', 10), 
      generateNewPlaceholderInventoryItem('coconutSeed', 25)]));
    setInventory(inv);
    saveInventory(inv);
  }

  function resetGarden() {
    const garden = new Garden("Test User", 6, 6);
    setGarden(garden);
    saveGarden(garden);
  }

  function renderGarden() {
    const findGardenComponent = () => {
      if (!garden || !inventory) return <div>Loading Garden...</div>;
      return <GardenComponent garden={garden} inventory={inventory} selected={selected} setSelected={setSelected} inventoryForceRefresh={{value: inventoryForceRefreshKey, setter: setInventoryForceRefreshKey}}/>;
    }

    const findInventoryComponent = () => {
      if (!inventory) return <div>Loading Inventory...</div>;
      return <InventoryComponent key={inventoryForceRefreshKey} inventory={inventory} onInventoryItemClickFunction={setSelected} costMultiplier={1}/>;
    }
    return <>
    <div className="flex">
      <div className="w-2/3">
        {findGardenComponent()}
      </div>
      <div className="w-1/3">
        {findInventoryComponent()}
      </div>
    </div>
    </>
  }

  return (<>
    <div className="mx-4 my-4">
      <div> 
        This is the Garden Page!
      </div>
      <div>{renderGarden()}</div>
      <div>
      <button onClick={printGarden} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>print garden</button>
      </div>
      <div>
      <button onClick={addAppleSeed} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>gain apple seed</button>
      </div>
      <div>
      <button onClick={resetInventory} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>reset inventory</button>
      </div>
      <div>
      <button onClick={resetGarden} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>reset garden</button>
      </div>
    </div>
    </>
  );
}

export default GardenPage;