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
import { Store } from "@/models/itemStore/store/Store";
import { loadStore, saveStore } from "@/utils/localStorage/store";
import TradeWindowComponent from "./tradeWindow";

const StorePage = () => {
  function renderStore() {
    const [store, setStore] = useState<Store | null>(null);
    const [inventory, setInventory] = useState<Inventory | null>(null);
    //Hack to force refresh inventory when its contents change in another component
    const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);
    const [selected, setSelected] = useState<InventoryItem | null>(null);
    const [owner, setOwner] = useState<Store | Inventory | null>(null);

    function setupInventory(): Inventory {
      let inv = loadInventory();
      console.log(inv);
      if (!(inv instanceof Inventory)) {
        console.log('inventory not found, setting up');
        inv = new Inventory("Test User", 100, new ItemList([
          generateNewPlaceholderInventoryItem('appleSeed', 10), 
          generateNewPlaceholderInventoryItem('benchBlueprint', 5), 
          generateNewPlaceholderInventoryItem('bananaSeed', 10), 
          generateNewPlaceholderInventoryItem('coconutSeed', 25)]));
        saveInventory(inv);
      }
      // setSelected(inv.getItem('apple seed').payload);
      return inv;
    }
    
    useEffect(() => {
      const inv = setupInventory();
      setInventory(inv);
    }, []);

    function setupStore(): Store {
      let store = loadStore();
      console.log(store);
      if (!(store instanceof Store)) {
        console.log('store not found, setting up');
        store = new Store(0, "Test Store", 2, 1, new ItemList(), new ItemList([
          generateNewPlaceholderInventoryItem('appleSeed', 10),
          generateNewPlaceholderInventoryItem('bananaSeed', 10),
          generateNewPlaceholderInventoryItem('coconutSeed', 10),
          generateNewPlaceholderInventoryItem('benchBlueprint', 10),
        ]));
        store.restockStore();
        saveStore(store);
      }
      return store;
    }
    
    useEffect(() => {
      const store = setupStore();
      setStore(store);
    }, []);

    const inventorySetSelected = (arg: InventoryItem | null) => {
      setOwner(inventory);
      setSelected(arg);
    }

    const tradeWindowSetSelected = (arg: InventoryItem | null) => {
      setOwner(null);
      setSelected(arg);
    }

    const storeSetSelected = (arg: InventoryItem | null) => {
      setOwner(store);
      setSelected(arg);
    }

    const findStoreComponent = () => {
      if (!store) return <div>Loading Store...</div>;
      return <StoreComponent store={store} onInventoryItemClickFunction={storeSetSelected}/>;
    }

    const findTradeWindowComponent = () => {
      if (!inventory || !store) return <div>Loading Trade Window...</div>;
      return <TradeWindowComponent store={store} inventory={inventory} selected={selected} setSelected={setSelected} owner={owner} costMultiplier={getCostMultiplier()}/>;
    }

    const findInventoryComponent = () => {
      if (!inventory || !store) return <div>Loading Inventory...</div>;
      return <InventoryComponent key={inventoryForceRefreshKey} inventory={inventory} onInventoryItemClickFunction={inventorySetSelected} costMultiplier={store.getSellMultiplier()}/>;
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
    <div className="mx-4 my-4"> 
      <div>This is the Store Page! </div>
      {renderStore()}
    </div>
    </>
  );
}

export default StorePage;