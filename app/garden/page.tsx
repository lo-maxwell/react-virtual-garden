'use client'
import InventoryComponent from "@/components/inventory/inventory";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/inventory/Inventory";
import { ItemList } from "@/models/inventory/ItemList";
import { ItemTemplate, PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { loadInventory, saveInventory } from "@/utils/localStorage/inventory";
import { useEffect, useState } from "react";
import GardenComponent from "./garden";


export default function Home() {
  const [garden, setGarden] = useState(new Garden("Dummy User", 10, 10));
  const [inventory, setInventory] = useState<Inventory>(new Inventory(""));
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
    const inv = setupInventory("Dummy User");
    setInventory(inv);
  }, []);

  const [selected, setSelected] = useState(inventory.getItem('apple seed').payload);

  function printGarden() {
    console.log(garden.getPlots());
    console.log(inventory.getAllItems());
  }

  function addAppleSeed() {
    inventory.gainItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 10);
    setSelected(inventory.getItem('apple seed').payload);
    setInventoryForceRefreshKey(inventoryForceRefreshKey + 1);
    saveInventory(inventory);
  }

  function resetInventory() {
    const inv = new Inventory("Dummy User", 100, new ItemList([
      generateNewPlaceholderInventoryItem('appleSeed', 10), 
      generateNewPlaceholderInventoryItem('benchBlueprint', 5), 
      generateNewPlaceholderInventoryItem('bananaSeed', 10), 
      generateNewPlaceholderInventoryItem('coconutSeed', 25)]));
    setInventory(inv);
    saveInventory(inv);
  }

  return (<>
      <div> 
        This is the Garden Page!
      </div>
      <GardenComponent garden={garden} inventory={inventory} selected={selected} setSelected={setSelected} inventoryForceRefresh={{value: inventoryForceRefreshKey, setter: setInventoryForceRefreshKey}}></GardenComponent>
      <InventoryComponent key={inventoryForceRefreshKey} inventory={inventory} setSelected={setSelected}></InventoryComponent>
      <div>
      <button onClick={printGarden} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>print garden</button>
      </div>
      <div>
      <button onClick={addAppleSeed} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>gain apple seed</button>
      </div>
      <div>
      <button onClick={resetInventory} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>reset inventory</button>
      </div>
    </>
  );
}
