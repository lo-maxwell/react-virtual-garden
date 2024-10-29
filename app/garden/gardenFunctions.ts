import { PlotComponentRef } from "@/components/garden/plot";
import { Garden } from "@/models/garden/Garden";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import User from "@/models/user/User";
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
  try {

    const data = {
      axis: 'row',
      expand: true
    }
    // Making the PATCH request to your API endpoint
    const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Send the data in the request body
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to add row');
    }

    // Parsing the response data
    const result = await response.json();
    console.log('Successfully added row:', result);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function addColumnAPI(garden: Garden, user: User) {
  try {
    const data = {
      axis: 'column',
      expand: true
    }
    // Making the PATCH request to your API endpoint
    const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Send the data in the request body
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to add column');
    }

    // Parsing the response data
    const result = await response.json();
    console.log('Successfully added column:', result);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function removeRowAPI(garden: Garden, user: User) {
  try {
    const data = {
      axis: 'row',
      expand: false
    }
    // Making the PATCH request to your API endpoint
    const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Send the data in the request body
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to remove row');
    }

    // Parsing the response data
    const result = await response.json();
    console.log('Successfully removed row:', result);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function removeColumnAPI(garden: Garden, user: User) {
  try {
    const data = {
      axis: 'column',
      expand: false
    }
    // Making the PATCH request to your API endpoint
    const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/resize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Send the data in the request body
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to remove column');
    }

    // Parsing the response data
    const result = await response.json();
    console.log('Successfully removed column:', result);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function syncGardenSize(garden: Garden, user: User): Promise<boolean> {
  try {
    // Making the GET request to your API endpoint
    const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/size`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to fetch garden size');
    }

    // Parsing the response data
    const result = await response.json();
    garden.setGardenSize(result.rows, result.columns);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function syncUserGardenInventory(user: User, garden: Garden, inventory: Inventory): Promise<boolean> {
  try {
    // Sync user data
    const userResponse = await fetch(`/api/user/${user.getUserId()}/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user');
    }
    const userResult = await userResponse.json();
    saveUser(User.fromPlainObject(userResult));
    Object.assign(user, User.fromPlainObject(userResult));

    // Sync garden data
    const gardenResponse = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!gardenResponse.ok) {
      throw new Error('Failed to fetch garden');
    }
    const gardenResult = await gardenResponse.json();
    saveGarden(Garden.fromPlainObject(gardenResult));
    Object.assign(garden, Garden.fromPlainObject(gardenResult));

    // Sync inventory data
    const inventoryResponse = await fetch(`/api/user/${user.getUserId()}/inventory/${inventory.getInventoryId()}/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!inventoryResponse.ok) {
      throw new Error('Failed to fetch inventory');
    }
    const inventoryResult = await inventoryResponse.json();
    saveInventory(Inventory.fromPlainObject(inventoryResult));
    Object.assign(inventory, Inventory.fromPlainObject(inventoryResult));
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
    const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plantAll`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to plant all seeds');
    }
    const result = await response.json();
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
    const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/harvestAll`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to harvest all seeds');
    }
    const result = await response.json();
    console.log('Successfully harvested all seeds:', result);
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}