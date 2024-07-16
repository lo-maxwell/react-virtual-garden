'use client'
import InventoryComponent from "@/components/inventory/inventory";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/inventory/Inventory";
import { ItemList } from "@/models/inventory/ItemList";
import { ItemTemplate, PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { useState } from "react";
import GardenComponent from "./garden";


export default function Home() {
  const [garden, setGarden] = useState(new Garden("Dummy User", 10, 10));
  function setupInventory(userId: string) {
    const inv = new Inventory(userId, 100, new ItemList([generateNewPlaceholderInventoryItem('appleSeed', 10), generateNewPlaceholderInventoryItem('benchBlueprint', 5), generateNewPlaceholderInventoryItem('bananaSeed', 10), generateNewPlaceholderInventoryItem('coconutSeed', 25)]));
    return inv;
  }
  const [inventory, setInventory] = useState(() => {return setupInventory("Dummy User");});
  //Hack to force refresh inventory when its contents change in another component
  const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);
  const [selected, setSelected] = useState(inventory.getItem('apple seed').payload);

  function printGarden() {
    console.log(garden.getPlots());
    console.log(inventory.getAllItems());
  }

  function addAppleSeed() {
    inventory.gainItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 10);
    setSelected(inventory.getItem('apple seed').payload);
    setInventoryForceRefreshKey(inventoryForceRefreshKey + 1);
  }

  return (<>
      <div> 
        This is the Garden Page!
      </div>
      <GardenComponent garden={garden} inventory={inventory} selected={selected} setSelected={setSelected} inventoryForceRefresh={{value: inventoryForceRefreshKey, setter: setInventoryForceRefreshKey}}></GardenComponent>
      <InventoryComponent key={inventoryForceRefreshKey} inventory={inventory} setSelected={setSelected}></InventoryComponent>
      <div>
      <button onClick={printGarden}>print garden</button>
      </div>
      <div>
      <button onClick={addAppleSeed}>gain apple seed</button>
      </div>
    </>
  );
}
