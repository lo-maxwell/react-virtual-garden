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
import { useStore } from "@/hooks/contexts/StoreContext";
import { useInventory } from "@/hooks/contexts/InventoryContext";

const StorePage = () => {
  function renderStore() {
    const {store} = useStore();
    const { inventory } = useInventory();
    //Hack to force refresh inventory when its contents change in another component
    const [inventoryForceRefreshKey, setInventoryForceRefreshKey] = useState(0);
    const [selected, setSelected] = useState<InventoryItem | null>(null);
    const [owner, setOwner] = useState<Store | Inventory | null>(null);

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
      return <StoreComponent onInventoryItemClickFunction={storeSetSelected}/>;
    }

    const findTradeWindowComponent = () => {
      if (!inventory || !store) return <div>Loading Trade Window...</div>;
      return <TradeWindowComponent selected={selected} setSelected={setSelected} owner={owner} costMultiplier={getCostMultiplier()}/>;
    }

    const findInventoryComponent = () => {
      if (!inventory || !store) return <div>Loading Inventory...</div>;
      return <InventoryComponent key={inventoryForceRefreshKey} onInventoryItemClickFunction={inventorySetSelected} costMultiplier={store.getSellMultiplier()}/>;
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