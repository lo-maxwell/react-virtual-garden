
import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import { InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import assert from "assert";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";

/**
 * @returns an inventory plain object
 */
export async function getInventoryFromDatabase(inventoryId: string, userId: string, client?: PoolClient): Promise<any> {
	if (process.env.USE_DATABASE === 'LAMBDA') { //TODO: TEST
		try {

			// 'SELECT id, owner, gold FROM inventories WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, identifier, quantity FROM inventory_items WHERE owner = $1'
			const payload = {
				"queries": [
					{
						"returnColumns": [
							"id",
							"owner",
							"gold"
						],
						"tableName": "inventories",
						"conditions": {
							"id": {
							"operator": "=",
							"value": inventoryId
							},
							"owner": {
								"operator": "=",
								"value": userId
								}
						},
						"limit": 1
					},
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"quantity"
						],
						"tableName": "inventory_items",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": inventoryId
								}
						},
						"limit": 1000
					}
				]
			  }
			const queryResult = await invokeLambda('garden-select', payload);
			const inventoryResult = queryResult[0];
			let inventoryItemsResult = queryResult[1];
			// Check if result is valid
			if (!inventoryResult) {
				throw new Error(`Could not find inventory for inventory id ${inventoryId}`);
			}
			const inventoryEntityResult = parseRows<InventoryEntity[]>(inventoryResult)[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntityResult));
			console.log(inventoryEntityResult);

			let inventoryItems: ItemList | null;
			if (!inventoryItemsResult) {
				console.error(`Error parsing inventoryItems for inventory id ${inventoryId}`);
				inventoryItems = null;
			} else {
				inventoryItems = inventoryItemRepository.makeInventoryItemObjectBatch(parseRows<InventoryItemEntity[]>(inventoryItemsResult));
			}
			const inventoryInstance = await inventoryRepository.makeInventoryObject(inventoryEntityResult, inventoryItems);
			return inventoryInstance.toPlainObject();
		} catch (error) {
			console.error('Error fetching inventory from Lambda:', error);
			throw error;
		}
	} else {
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
			const inventoryItemList = await inventoryRepository.getInventoryItems(inventoryResult.id);
			const inventoryInstance = await inventoryRepository.makeInventoryObject(inventoryResult, inventoryItemList);

			return inventoryInstance.toPlainObject();
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchInventoryFromDatabase', client);
	}
}