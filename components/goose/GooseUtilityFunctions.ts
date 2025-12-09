import Goose from "@/models/goose/Goose";
import GoosePen from "@/models/goose/GoosePen";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { makeApiRequest } from "@/utils/api/api";

export async function feedGooseAPI(goosePen: GoosePen, goose: Goose, inventory: Inventory, selectedItem: InventoryItem, feedQuantity: number): Promise<boolean> {
	const data = {
	  inventoryId: inventory.getInventoryId(),
	  inventoryItemIdentifier: selectedItem.itemData.id
	};
  
	try {
	  const apiRoute = `/api/goose/${goosePen.getId()}/gooses/${goose.getId()}/feed`;
	  const result = await makeApiRequest('POST', apiRoute, data, true);
	  console.log('Successfully fed goose:', result);
	  if (!result.success) {
		console.error("Error feeding goose:", result.error);
		return false;
	  }
	  return result.success;
	} catch (error) {
	  console.error(error);
	  return false;
	}
  }