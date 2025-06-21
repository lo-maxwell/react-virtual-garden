import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItem, InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { getItemClassFromSubtype } from "@/models/items/utility/itemClassMaps";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import assert from "assert";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from 'uuid';

class InventoryItemRepository {

	/**
	 * Ensures that the object is of type InventoryItemEntity, ie. that it contains an id, owner, identifier, and quantity field
	 */
	validateInventoryItemEntity(inventoryItemEntity: any): boolean {
		if (!inventoryItemEntity || (typeof inventoryItemEntity.id !== 'string') || (typeof inventoryItemEntity.owner !== 'string') || (typeof inventoryItemEntity.identifier !== 'string') || (typeof inventoryItemEntity.quantity !== 'number')) {
			console.error(inventoryItemEntity);
			throw new Error(`Invalid types while creating InventoryItem from InventoryItemEntity`);
		}
		return true;
	}

	makeInventoryItemObjectBatch(inventoryItemEntities: InventoryItemEntity[]): InventoryItemList {
		const items = new InventoryItemList();
		for (const itemResult of inventoryItemEntities) {
			try {
				const item = this.makeInventoryItemObject(itemResult);
				items.addItem(item, item.getQuantity());
			} catch (error) {
				console.error(`Failure while initializing items for inventory from database: `);
				console.error(error);
			}
		}
		return items;
	}

	makeInventoryItemObject(inventoryItemEntity: InventoryItemEntity): InventoryItem {
		assert(this.validateInventoryItemEntity(inventoryItemEntity), 'InventoryItemEntity validation failed');

		const itemData = itemTemplateFactory.getInventoryTemplateById(inventoryItemEntity.identifier);
		if (!itemData) {
			console.warn(`Could not find inventoryItem matching id ${inventoryItemEntity.identifier}`)
			return new HarvestedItem(inventoryItemEntity.id, HarvestedItemTemplate.getErrorTemplate(), 0);
		}
		const itemClass = getItemClassFromSubtype(itemData);

		const instance = new itemClass(inventoryItemEntity.id, itemData, inventoryItemEntity.quantity);
		if (!(instance instanceof InventoryItem)) {
			console.warn(`Attempted to create non InventoryItem for id ${inventoryItemEntity.identifier}`);
			return new HarvestedItem(inventoryItemEntity.id, HarvestedItemTemplate.getErrorTemplate(), 0);
		}
		return instance;
	}

	/**
	 * Throws an error. Do not use!
	 * May throw errors if the query is misshapped.
	 * @returns InventoryItem[]
	 */
	async getAllInventoryItems(): Promise<InventoryItemEntity[]> {
		throw new Error('Not implemented yet!');
	}

	/**
	 * Given its id, returns the row data of an inventoryItem from the database.
	 * @id the id of the inventoryItem in the database
	 */
	async getInventoryItemById(id: string): Promise<InventoryItemEntity | null> {
		const result = await query<InventoryItemEntity>('SELECT id, owner, identifier, quantity FROM inventory_items WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeInventoryItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given an inventory id, returns all inventory items owned by that inventory from the database.
	 * @id the id of the inventory in the database
	 */
	async getAllInventoryItemsByOwnerId(inventoryId: string): Promise<InventoryItemEntity[]> {
		const result = await query<InventoryItemEntity>(
			'SELECT id, owner, identifier, quantity FROM inventory_items WHERE owner = $1',
			[inventoryId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		return result.rows;
		// const instance = makeInventoryItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given an inventory id, returns the row data of an inventoryItem from the database.
	 * @id the id of the inventory in the database
	 * @identifier the item template id
	 */
	async getInventoryItemByOwnerId(inventoryId: string, identifier: string): Promise<InventoryItemEntity | null> {
		const result = await query<InventoryItemEntity>('SELECT id, owner, identifier, quantity FROM inventory_items WHERE owner = $1 AND identifier = $2', [inventoryId, identifier]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeInventoryItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Begins a transaction if there is not already one. Creates a new inventoryItem row.
	 * On error, rolls back.
	 * @ownerId the id of the owner of this inventoryItem. If the owner cannot be found, fails.
	 * @inventoryItem the inventoryItem used to create this object
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns an InventoryItemEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createInventoryItem(ownerId: string, inventoryItem: InventoryItem, client?: PoolClient): Promise<InventoryItemEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {

			const existingItemResult = await client.query<InventoryItemEntity>(
				`SELECT id, owner, identifier, quantity FROM inventory_items 
				WHERE id = $1 OR (owner = $2 AND identifier = $3)`, 
				[inventoryItem.getInventoryItemId(), ownerId, inventoryItem.itemData.id]
			);

			if (existingItemResult.rows.length > 0) {
				return existingItemResult.rows[0];
			}

			const result = await client.query<InventoryItemEntity>(
				`INSERT INTO inventory_items (id, owner, identifier, quantity) 
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (id) 
				DO NOTHING
				RETURNING id, owner, identifier, quantity`,
				[inventoryItem.getInventoryItemId(), ownerId, inventoryItem.itemData.id, inventoryItem.getQuantity()]
			);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('There was an error creating the inventoryItem');
			}

			return result.rows[0];
		} 

		return transactionWrapper(innerFunction, "createInventoryItem", client);
	}


	/**
	 * Adds an item to the database. If the item already exists, adds to its quantity. Otherwise, creates a new item row. Begins a transaction if there is not already one. 
	 * On error, rolls back.
	 * @ownerId the id of the owner of this inventoryItem. If the owner cannot be found, fails.
	 * @inventoryItem the inventoryItem used to create this object
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a InventoryItemEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async addInventoryItem(ownerId: string, inventoryItem: InventoryItem, client?: PoolClient): Promise<InventoryItemEntity> {
		if (inventoryItem.getQuantity() < 0) {
			throw new Error(`Cannot add inventory item with quantity ${inventoryItem.getQuantity()}`);
		}
		if (inventoryItem.getQuantity() == 0) {
			console.warn(`Attempted to add inventoryItem with 0 quantity`)
		}
		
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
			// Check if the inventoryItem already exists
			const existingInventoryItemResult = await this.getInventoryItemByOwnerId(ownerId, inventoryItem.itemData.id);

			if (existingInventoryItemResult) {
				// InventoryItem already exists
				const updateResult = await this.updateInventoryItemQuantity(existingInventoryItemResult.id, inventoryItem.getQuantity(), client);
				if (!updateResult) {
					throw new Error(`Failed to update quantity while adding item with id ${existingInventoryItemResult.id}`)
				}
				return updateResult;
				// return makeInventoryItemObject(updateResult); 
			}
			
			const result = await this.createInventoryItem(ownerId, inventoryItem, client);

			// Check if result is valid
			if (!result) {
				throw new Error('There was an error creating the inventoryItem');
			}

			// Return the created InventoryItem as an instance
			return result;
		}
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addInventoryItem', client);

	}

	/**
	 * If the item does not exist, creates it for the specified inventory. Otherwise, sets its identifier and/or quantity.
	 * Do not use this to add inventory items.
	 * @inventoryId the id of the inventory that this item belongs to
	 * @item the inventory item
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new InventoryItemEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdateInventoryItem(inventoryId: string, item: InventoryItem, client?: PoolClient): Promise<InventoryItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
			// Check if the item already exists
			const existingInventoryItemResult = await client.query<{id: string}>(
				'SELECT id FROM inventory_items WHERE owner = $1 AND identifier = $2',
				[inventoryId, item.itemData.id]
			);

			let result;

			if (existingInventoryItemResult.rows.length > 0) {
				// Item already exists
				result = await this.setInventoryItemQuantity(existingInventoryItemResult.rows[0].id, item.getQuantity(), client);
				if (!result) {
					throw new Error(`Error updating inventory item with id ${item.getInventoryItemId()}`);
				} 
			} else {
				result = await this.createInventoryItem(inventoryId, item, client);
				if (!result) {
					throw new Error(`Error creating inventory item with id ${item.getInventoryItemId()}`);
				} 
			}

			return result;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createOrUpdateInventoryItem', client);
	}

	/**
	 * Changes all data fields for a specified inventoryItem (identifier, quantity)
	 * Changing the identifier is a dangerous operation, watch for collisions.
	 * @item the InventoryItem to update
	 * @returns a InventoryItemEntity with the new data on success (or throws error)
	 */
	async updateEntireInventoryItem(item: InventoryItem): Promise<InventoryItemEntity> {
		const inventoryItemResult = await query<InventoryItemEntity>(
			'UPDATE inventory_items SET identifier = $1, quantity = $2 WHERE id = $3 RETURNING id, owner, identifier, quantity',
			[item.itemData.id, item.getQuantity(), item.getInventoryItemId()]
			);

		// Check if result is valid
		if (!inventoryItemResult || inventoryItemResult.rows.length === 0) {
			throw new Error(`Could not find inventoryItem for id ${item.getInventoryItemId()}`);
		}

		const updatedRow = inventoryItemResult.rows[0];
		return updatedRow;
	}

	/**
	 * Sets the quantity of the inventoryItem. Does not validate quantity amount, except for checking that it is nonnegative. Uses row level locking.
	 * Does not delete the item if quantity is set to 0. Use deleteInventoryItemById for that.
	 * @id the id of the item
	 * @newQuantity the new quantity
	 * @returns a InventoryItemEntity with the new data on success (or throws error)
	 */
	async setInventoryItemQuantity(id: string, newQuantity: number, client?: PoolClient): Promise<InventoryItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
			const inventoryItemResult = await client.query<InventoryItemEntity>(
				'UPDATE inventory_items SET quantity = $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[newQuantity, id]
			);

			// Check if result is valid
			if (!inventoryItemResult || inventoryItemResult.rows.length === 0) {
				throw new Error('There was an error updating the inventoryItem');
			}

			return inventoryItemResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setInventoryItemQuantity', client);
	}

	/**
	 * Updates the quantity of the inventoryItem. Does not validate quantity amount, except that the result must be nonnegative. Uses row level locking.
	 * If the quantity drops to 0, the item is not deleted from the database.
	 * @id the id of the inventoryitem
	 * @quantityDelta the quantity change
	 * @returns a InventoryItemEntity with the new data on success (or throws error)
	 */
	async updateInventoryItemQuantity(id: string, quantityDelta: number, client?: PoolClient): Promise<InventoryItemEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
			const inventoryItemResult = await client.query<InventoryItemEntity>(
				'UPDATE inventory_items SET quantity = quantity + $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[quantityDelta, id]
				);


			// Check if result is valid
			if (!inventoryItemResult || inventoryItemResult.rows.length === 0) {
				throw new Error('There was an error updating the inventoryItem');
			}

			const updatedRow = inventoryItemResult.rows[0];
			return updatedRow;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addInventoryItem', client);
	}


	/**
	 * Deletes the specified inventoryItem from the database. Returns the deleted row.
	 * @id the id of the inventoryItem
	 * @returns a InventoryItemEntity with the new data on success (or throws error)
	 */
	async deleteInventoryItemById(id: string, client?: PoolClient): Promise<InventoryItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
			// Lock the row for update
			const lockResult = await client.query<{id: string, current_quantity: number}>(
				'SELECT id, quantity AS current_quantity FROM inventory_items WHERE id = $1',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`InventoryItem not found for id: ${id}`);
			}
			const deleteResult = await client.query<InventoryItemEntity>(
				'DELETE FROM inventory_items WHERE id = $1 RETURNING id, owner, identifier, quantity',
				[id]
			);

			return deleteResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'deleteInventoryItemById', client);
	}


	/**
	 * Deletes the specified inventoryItem from the database. Returns the deleted row.
	 * @ownerId the id of the owner
	 * @identifier the item template id
	 * @returns a InventoryItemEntity with the new data on success (or throws error)
	 */
	async deleteInventoryItemByOwnerId(ownerId: string, identifier: string, client?: PoolClient): Promise<InventoryItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
			// Lock the row for update
			const lockResult = await client.query<{id: string, current_quantity: number}>(
				'SELECT id, quantity AS current_quantity FROM inventory_items WHERE owner = $1 AND identifier = $2 FOR UPDATE',
				[ownerId, identifier]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`InventoryItem not found for ownerId: ${ownerId}`);
			}
			const deleteResult = await client.query<InventoryItemEntity>(
				'DELETE FROM inventory_items WHERE owner = $1 AND identifier = $2 RETURNING id, owner, identifier, quantity',
				[ownerId, identifier]
			);

			return deleteResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'deleteInventoryItemByOwnerId', client);
	}
}

const inventoryItemRepository = new InventoryItemRepository();
export default inventoryItemRepository;
