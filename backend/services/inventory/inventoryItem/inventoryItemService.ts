import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import { InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory, InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import assert from "assert";
import { PoolClient } from "pg";
import { getInventoryEntity } from "@/backend/services/inventory/inventoryService";

/**
 * Creates a new row, or adds to the existing rows, for every inventory item in items. 
 * Requires lambda connection.
 * @param inventoryId - The ID of the inventory to upsert items into.
 * @param userId - The ID of the user who owns the inventory.
 * @param items - A list of inventory items to upsert.
 * @param client - Optional: A PoolClient for database transactions.
 * @returns A promise that resolves to the updated InventoryEntity.
 */
export async function upsertInventoryItems(inventoryId: string, userId: string, items: InventoryItemList, client?: PoolClient): Promise<InventoryEntity> {

	if (process.env.USE_DATABASE === 'LAMBDA') {

		const inventoryEntity = await getInventoryEntity(inventoryId, userId, client);
		assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
		

		if (items.size() <= 0) {
			return inventoryEntity;
		}
		const insert_payload = {"queries": [{
			"tableName": "inventory_items",
			"columnsToWrite": ["owner", "identifier", "quantity"],
			"values": items.getAllItems().map(item => [
			inventoryEntity.id, 
			item.itemData.id,
			item.getQuantity()
			]),
			"conflictColumns": ["owner", "identifier"],
			"updateQuery": {
			"values": {
				"quantity": {
				"excluded": true,
				"operator": "+"
				}
			},
			"conditions": {}
			},
			"returnColumns": ["id", "owner", "identifier", "quantity"]
		}]}
		const insertQueryResult = await invokeLambda('garden-insert', insert_payload);
		if (!insertQueryResult) {
			throw new Error(`Failed to insert from lambda`);
		}
		
		return inventoryEntity;
	} else {
		throw new Error('Lambda connection not set up');
	}
}