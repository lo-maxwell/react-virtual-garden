'use client'
import InventoryComponent from "@/components/inventory/inventory";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { loadInventory, saveInventory } from "@/utils/localStorage/inventory";
import { useEffect, useState } from "react";
import StoreComponent from "./store";

const StorePage = () => {
  function renderStore() {
    const [store, setStore] = useState<null>(null);
    const [inventory, setInventory] = useState<Inventory | null>(null);
    //Hack to force refresh inventory when its contents change in another component
    const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);
    const [selected, setSelected] = useState<InventoryItem | null>(null);

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

    const findStoreComponent = () => {
      if (!store) return <div>Loading Store...</div>;
      return <StoreComponent/>;
    }

    const findInventoryComponent = () => {
      if (!inventory) return <div>Loading Inventory...</div>;
      return <InventoryComponent key={inventoryForceRefreshKey} inventory={inventory} setSelected={setSelected}/>;
    }

    return <>
    <div className="flex">
      <div className="w-2/3">
        {findStoreComponent()}
      </div>
      <div className="w-1/3">
        {findInventoryComponent()}
      </div>
    </div>
    </>
  }

  return (<>
    <div className="mx-4 my-4"> 
      <div>This is the Store Page! </div>
      {renderStore()}
    </div>
    </>
  );
}

export default StorePage;