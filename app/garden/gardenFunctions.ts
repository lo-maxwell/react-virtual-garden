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
    return result;
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
    return result;
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
    return result;
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
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function syncGardenSize(garden: Garden, user: User): Promise<boolean> {
  const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/size`;
  try {
    const result = await makeApiRequest('GET', apiRoute, {}, true);
    garden.setGardenSize(result.rows, result.columns);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

//TODO: Bundle this into 1 api call
export async function syncUserGardenInventory(user: User, garden: Garden, inventory: Inventory): Promise<boolean> {
  
  try {
    // Sync user data
    const userApiRoute = `/api/user/${user.getUserId()}/get`;
    const userResult = await makeApiRequest('GET', userApiRoute, {}, true);
    saveUser(User.fromPlainObject(userResult));

    // Sync garden data
    const gardenApiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/get`;
    const gardenResult = await makeApiRequest('GET', gardenApiRoute, {}, true);
    saveGarden(Garden.fromPlainObject(gardenResult));

    // Sync inventory data
    const inventoryApiRoute = `/api/user/${user.getUserId()}/inventory/${inventory.getInventoryId()}/get`;
    const inventoryResult = await makeApiRequest('GET', inventoryApiRoute, {}, true);
    saveInventory(Inventory.fromPlainObject(inventoryResult));
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
    return result;
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
    replacementItem: null, 
    instantHarvestKey: instantGrow ? 'mangomangobear' : ''
  };

  try {
    const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/harvestAll`;
    const result = await makeApiRequest('PATCH', apiRoute, data, true);
    console.log('Successfully harvested all plants:', result);
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}