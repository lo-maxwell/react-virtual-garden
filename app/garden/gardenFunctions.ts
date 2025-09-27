import { PlotComponentRef } from "@/components/garden/plot";
import { Garden } from "@/models/garden/Garden";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import User from "@/models/user/User";
import { makeApiRequest } from "@/utils/api/api";
import { auth } from "@/utils/firebase/firebaseConfig";
import { saveGarden } from "@/utils/localStorage/garden";
import { saveInventory } from "@/utils/localStorage/inventory";
import { saveUser } from "@/utils/localStorage/user";
import { fetchAccountObjects } from "../login/firebaseAuth/authClientService";
import { Store } from "../../models/itemStore/store/Store";
import { saveStore } from "../../utils/localStorage/store";

export function addRowLocal(garden: Garden, user: User) {
  const success = garden.addRow(user);
  if (success) {
    saveGarden(garden);
  }
  return success;
}

export function addColumnLocal(garden: Garden, user: User) {
  const success = garden.addColumn(user);
  if (success) {
    saveGarden(garden);
  }
  return success;
}

export function removeRowLocal(garden: Garden) {
  const success = garden.removeRow();
  if (success) {
    saveGarden(garden);
  }
  return success;
}

export function removeColumnLocal(garden: Garden) {
  const success = garden.removeColumn();
  if (success) {
    saveGarden(garden);
  }
  return success;
}


export async function addRowAPI(garden: Garden, user: User) {
  const data = {
    axis: 'row',
    expand: true
  }
  const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`;
  try {
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    if (!result.success) {
      console.error("Error adding row:", result.error);
      return false;
    }
    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function addColumnAPI(garden: Garden, user: User) {
  const data = {
    axis: 'column',
    expand: true
  }
  const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`;
  try {
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    if (!result.success) {
      console.error("Error adding column:", result.error);
      return false;
    }
    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function removeRowAPI(garden: Garden, user: User) {
  const data = {
    axis: 'row',
    expand: false
  }
  const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`;
  try {
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    if (!result.success) {
      console.error("Error removing row:", result.error);
      return false;
    }
    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function removeColumnAPI(garden: Garden, user: User) {
  const data = {
    axis: 'column',
    expand: false
  }
  const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`;
  try {
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    if (!result.success) {
      console.error("Error removing column:", result.error);
      return false;
    }
    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function syncGardenSize(garden: Garden, user: User): Promise<boolean> {
  const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/size`;
  try {
    const result = await makeApiRequest('GET', apiRoute, {}, true);
    if (!result.success) {
      console.error("Error syncing garden size:", result.error);
      return false;
    }
    garden.setGardenSize(result.data.rows, result.data.columns);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function plantAllAPI(plantedPlotIds: string[], inventory: Inventory, selectedItem: InventoryItem, user: User, garden: Garden) {
  const data = {
    plotIds: plantedPlotIds,
    inventoryId: inventory.getInventoryId(),
    inventoryItemIdentifier: selectedItem.itemData.id
  };

  try {
    const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plantAll`;
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    console.log('Successfully planted all seeds:', result);
    if (!result.success) {
      console.error("Error planting all seeds:", result.error);
      return false;
    }
    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function harvestAllAPI(harvestedPlotIds: string[], inventory: Inventory, user: User, garden: Garden, instantGrow: boolean) {
  const data = {
    plotIds: harvestedPlotIds,
    inventoryId: inventory.getInventoryId(), 
    levelSystemId: user.getLevelSystem().getLevelSystemId(), 
    numHarvests: 1,
    replacementItem: null, 
    instantHarvestKey: instantGrow ? 'mangomangobear' : ''
  };

  try {
    const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/harvestAll`;
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    console.log('Successfully harvested all plants:', result);
    if (!result.success) {
      console.error("Error harvesting all plants:", result.error);
      return false;
    }
    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function pickupAllAPI(pickupPlotIds: string[], inventory: Inventory, user: User, garden: Garden) {
  const data = {
    plotIds: pickupPlotIds,
    inventoryId: inventory.getInventoryId(), 
    replacementItem: null, 
  };

  try {
    const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/pickupAll`;
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    console.log('Successfully picked up all decorations:', result);
    if (!result.success) {
      console.error("Error picking up all decorations:", result.error);
      return false;
    }
    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function syncAllAccountObjects(user: User, garden: Garden, inventory: Inventory): Promise<boolean> {
  try {
    const result = await fetchAccountObjects();
    if (!result) {
      console.error(`Could not find result of fetchAccountObjects!`);
      return false;
    }

    saveUser(User.fromPlainObject(result.plainUserObject));
    saveGarden(Garden.fromPlainObject(result.plainGardenObject));
    saveInventory(Inventory.fromPlainObject(result.plainInventoryObject));
    saveStore(Store.fromPlainObject(result.plainStoreObject));
    return true;
  } catch (error) {
    console.error("Error syncing all account objects:", error);
    return false;
  }
}