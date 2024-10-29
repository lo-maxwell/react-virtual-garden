
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";

/**
 * @returns an inventory plain object
 */
export async function getInventoryFromDatabase(inventoryId: string, userId: string, client?: PoolClient): Promise<any> {
	const innerFunction = async (client: PoolClient) => {
		//Create inventory
		const inventoryResult = await inventoryRepository.getInventoryById(inventoryId);
		// Check if result is valid
		if (!inventoryResult) {
			throw new Error(`Could not find the inventory for id ${inventoryId}`);
		}
		if (inventoryResult.owner !== userId) {
			throw new Error(`Invalid owner of inventory ${inventoryId}`);
		}
		const inventoryInstance = await inventoryRepository.makeInventoryObject(inventoryResult);

		return inventoryInstance.toPlainObject();
	}
	// Call transactionWrapper with inner function and description
	return transactionWrapper(innerFunction, 'fetchInventoryFromDatabase', client);
}