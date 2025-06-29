import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItem, StoreItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { getItemClassFromSubtype } from "@/models/items/utility/itemClassMaps";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { assert } from "console";
import { PoolClient } from "pg";

class StoreItemRepository {

	/**
	 * Ensures that the object is of type StoreItemEntity, ie. that it contains an id, owner, identifier, and quantity field
	 */
	validateStoreItemEntity(storeItemEntity: any): boolean {
		if (!storeItemEntity || (typeof storeItemEntity.id !== 'string') || (typeof storeItemEntity.owner !== 'string') || (typeof storeItemEntity.identifier !== 'string') || (typeof storeItemEntity.quantity !== 'number')) {
			console.error(storeItemEntity);
			throw new Error(`Invalid types while creating StoreItem from StoreItemEntity`);
		}
		return true;
	}

	makeStoreItemObjectBatch(storeItemEntities: StoreItemEntity[]): InventoryItemList {
		const items = new InventoryItemList();
		for (const itemResult of storeItemEntities) {
			try {
				const item = this.makeStoreItemObject(itemResult);
				items.addItem(item, item.getQuantity());
			} catch (error) {
				console.error(`Failure while initializing items for store from database: `);
				console.error(error);
			}
		}
		return items;
	}

	makeStoreItemObject(storeItemEntity: StoreItemEntity): InventoryItem {
		assert(this.validateStoreItemEntity(storeItemEntity), 'StoreItemEntity validation failed');

		const itemData = itemTemplateFactory.getInventoryTemplateById(storeItemEntity.identifier);
		if (!itemData) {
			console.warn(`Could not find storeItem matching id ${storeItemEntity.identifier}`)
			return new HarvestedItem(storeItemEntity.id, HarvestedItemTemplate.getErrorTemplate(), 0);
		}
		const itemClass = getItemClassFromSubtype(itemData);

		const instance = new itemClass(storeItemEntity.id, itemData, storeItemEntity.quantity);
		if (!(instance instanceof InventoryItem)) {
			console.warn(`Attempted to create non StoreItem for id ${storeItemEntity.identifier}`);
			return new HarvestedItem(storeItemEntity.id, HarvestedItemTemplate.getErrorTemplate(), 0);
		}
		return instance;
	}

	/**
	 * Throws an error. Do not use!
	 * May throw errors if the query is misshapped.
	 * @returns StoreItem[]
	 */
	async getAllStoreItems(): Promise<StoreItemEntity[]> {
		throw new Error('Not implemented yet!');
	}

	/**
	 * Given its id, returns the row data of an storeItem from the database.
	 * @id the id of the storeItem in the database
	 */
	async getStoreItemById(id: string): Promise<StoreItemEntity | null> {
		const result = await query<StoreItemEntity>('SELECT id, owner, identifier, quantity FROM store_items WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeStoreItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given an store id, returns the row data of an storeItem from the database.
	 * @id the id of the inventory in the database
	 * @identifier the item template id
	 */
	async getStoreItemByOwnerId(storeId: string, identifier: string): Promise<StoreItemEntity | null> {
		const result = await query<StoreItemEntity>('SELECT id, owner, identifier, quantity FROM store_items WHERE owner = $1 AND identifier = $2', [storeId, identifier]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeStoreItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given a store id, returns all inventory items owned by that store from the database.
	 * @id the id of the store in the database
	 */
	 async getAllStoreItemsByOwnerId(storeId: string): Promise<StoreItemEntity[]> {
		const result = await query<StoreItemEntity>(
			'SELECT id, owner, identifier, quantity FROM store_items WHERE owner = $1',
			[storeId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		return result.rows;
		// const instance = makeInventoryItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Begins a transaction if there is not already one. Creates a new storeItem row.
	 * On error, rolls back.
	 * @ownerId the id of the owner of this storeItem. If the owner cannot be found, fails.
	 * @storeItem the storeItem used to create this object
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns an StoreItemEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createStoreItem(ownerId: string, storeItem: InventoryItem, client?: PoolClient): Promise<StoreItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<StoreItemEntity> => {

			const existingItemResult = await client.query<StoreItemEntity>(
				`SELECT id, owner, identifier, quantity FROM store_items 
				WHERE id = $1 OR (owner = $2 AND identifier = $3)`, 
				[storeItem.getInventoryItemId(), ownerId, storeItem.itemData.id]
			);

			if (existingItemResult.rows.length > 0) {
				return existingItemResult.rows[0];
			}
			
			const result = await client.query<StoreItemEntity>(
				`INSERT INTO store_items (id, owner, identifier, quantity) 
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (id) 
				DO NOTHING
				RETURNING id, owner, identifier, quantity`,
				[storeItem.getInventoryItemId(), ownerId, storeItem.itemData.id, storeItem.getQuantity()]
			);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('There was an error creating the storeItem');
			}

			return result.rows[0];
		} 
	
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createStoreItem', client);
	}

	//TODO: Move this to a service
	/**
	 * Adds an item to the database. If the item already exists, adds to its quantity. Otherwise, creates a new item row. Begins a transaction if there is not already one. 
	 * On error, rolls back.
	 * @ownerId the id of the owner of this storeItem. If the owner cannot be found, fails.
	 * @storeItem the storeItem used to create this object
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a StoreItemEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async addStoreItem(ownerId: string, storeItem: InventoryItem, client?: PoolClient): Promise<StoreItemEntity> {
		if (storeItem.getQuantity() <= 0) {
				throw new Error(`Cannot add inventory item with quantity ${storeItem.getQuantity()}`);
			}
		const innerFunction = async (client: PoolClient): Promise<StoreItemEntity> => {
			
			// Check if the storeItem already exists
			const existingStoreItemResult = await this.getStoreItemByOwnerId(ownerId, storeItem.itemData.id);

			if (existingStoreItemResult) {
				// StoreItem already exists
				const updateResult = await this.updateStoreItemQuantity(existingStoreItemResult.id, storeItem.getQuantity(), client);
				if (!updateResult) {
					throw new Error(`Failed to update quantity while adding item with id ${existingStoreItemResult.id}`)
				}
				return updateResult;
				// return makeStoreItemObject(updateResult); 
			}
			
			const result = await this.createStoreItem(ownerId, storeItem, client);

			// Check if result is valid
			if (!result) {
				throw new Error('There was an error creating the storeItem');
			}

			// Return the created StoreItem as an instance
			return result;
		} 
	
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addStoreItem', client);
	}

	/**
	 * If the item does not exist, creates it for the specified store. Otherwise, modifies its identifier and/or quantity.
	 * @storeId the id of the store that this item belongs to
	 * @item the inventory item
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new StoreItemEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdateStoreItem(storeId: string, item: InventoryItem, client?: PoolClient): Promise<StoreItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<StoreItemEntity> => {
			// Check if the store item already exists
			const existingStoreItemResult = await client.query<{id: string}>(
				'SELECT id FROM store_items WHERE owner = $1 AND identifier = $2',
				[storeId, item.itemData.id]
			);

			let result;

			if (existingStoreItemResult.rows.length > 0) {
				// Plot already exists
				result = await this.setStoreItemQuantity(existingStoreItemResult.rows[0].id, item.getQuantity(), client);
				if (!result) {
					throw new Error(`Error updating store item with id ${item.getInventoryItemId()}`);
				} 
			} else {
				result = await this.createStoreItem(storeId, item, client);
				if (!result) {
					throw new Error(`Error creating store item with id ${item.getInventoryItemId()}`);
				} 
			}

			return result;
		} 
	
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createOrUpdateStoreItem', client);
	}

	/**
	 * Changes all data fields for a specified storeItem (identifier, quantity)
	 * Changing the identifier is a dangerous operation, watch for collisions.
	 * @item the InventoryItem to update
	 * @returns a StoreItemEntity with the new data on success (or throws error)
	 */
	 async updateEntireStoreItem(item: InventoryItem): Promise<StoreItemEntity> {
		const storeItemResult = await query<StoreItemEntity>(
			'UPDATE store_items SET identifier = $1, quantity = $2 WHERE id = $3 RETURNING id, owner, identifier, quantity',
			[item.itemData.id, item.getQuantity(), item.getInventoryItemId()]
			);

		// Check if result is valid
		if (!storeItemResult || storeItemResult.rows.length === 0) {
			throw new Error(`Could not find storeItem for id ${item.getInventoryItemId()}`);
		}

		const updatedRow = storeItemResult.rows[0];
		return updatedRow;
	}

	/**
	 * If the item does not exist, creates it for the specified store. Otherwise, modifies its identifier and/or quantity.
	 * @storeId the id of the store that this item belongs to
	 * @item the inventory item
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new StoreItemEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrRestockStoreItem(storeId: string, item: InventoryItem, client?: PoolClient): Promise<StoreItemEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<StoreItemEntity> => {
			// Check if the store item already exists
			const existingStoreItemResult = await client.query<{id: string}>(
				'SELECT id FROM store_items WHERE owner = $1 AND identifier = $2',
				[storeId, item.itemData.id]
			);

			let result;

			if (existingStoreItemResult.rows.length > 0) {
				// Plot already exists
				result = await this.restockStoreItem(existingStoreItemResult.rows[0].id, item.getQuantity(), client);
				if (!result) {
					throw new Error(`Error restocking store item with id ${item.getInventoryItemId()}`);
				} 
			} else {
				result = await this.createStoreItem(storeId, item, client);
				if (!result) {
					throw new Error(`Error creating store item with id ${item.getInventoryItemId()}`);
				} 
			}

			return result;
		} 
	
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createOrRestockStoreItem', client);
	}

	/**
	 * Sets the quantity of the storeItem. Does not validate quantity amount, except for checking that it is nonnegative. Uses row level locking.
	 * Does not delete the item if quantity is set to 0. Use deleteStoreItemById for that.
	 * @id the id of the item
	 * @newQuantity the new quantity
	 * @returns a StoreItemEntity with the new data on success (or throws error)
	 */
	async setStoreItemQuantity(id: string, newQuantity: number, client?: PoolClient): Promise<StoreItemEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<StoreItemEntity> => {
		
			const storeItemResult = await client.query<StoreItemEntity>(
				'UPDATE store_items SET quantity = $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[newQuantity, id]
				);


			// Check if result is valid
			if (!storeItemResult || storeItemResult.rows.length === 0) {
				throw new Error('There was an error updating the storeItem');
			}

			const updatedRow = storeItemResult.rows[0];
			return updatedRow;
		} 
	
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setStoreItemQuantity', client);
	}



	/**
	 * If the quantity of the storeItem is below minQuantity, sets it to minQuantity. Does not validate quantity amount, except for checking that it is nonnegative. Uses row level locking.
	 * Does not delete the item if quantity is set to 0. Use deleteStoreItemById for that.
	 * @id the id of the item
	 * @minQuantity the minimum quantity to replace with
	 * @returns a StoreItemEntity with the new data on success (or throws error)
	 */
	 async restockStoreItem(id: string, minQuantity: number, client?: PoolClient): Promise<StoreItemEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<StoreItemEntity> => {
			const storeItemResult = await client.query<StoreItemEntity>(
				`UPDATE store_items SET quantity = CASE
					WHEN $1 > quantity THEN $1
					ELSE quantity
					END
				WHERE id = $2 RETURNING id, owner, identifier, quantity`,
				[minQuantity, id]
				);


			// Check if result is valid
			if (!storeItemResult || storeItemResult.rows.length === 0) {
				throw new Error('There was an error updating the storeItem');
			}

			const updatedRow = storeItemResult.rows[0];
			return updatedRow;
		} 
	
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'restockStoreItem', client);
	}

	/**
	 * Sets the quantity of the storeItem. Does not validate quantity amount, except that the result must be nonnegative. Uses row level locking.
	 * If the quantity drops to 0, the item is deleted from the database. In this case, the resulting StoreItemEntity will have a quantity of 0.
	 * @id the id of the inventoryitem
	 * @identifier the item template id
	 * @quantityDelta the quantity change
	 * @returns a StoreItemEntity with the new data on success (or throws error)
	 */
	async updateStoreItemQuantity(id: string, quantityDelta: number, client?: PoolClient): Promise<StoreItemEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			// //Lock the row for update
			// const lockResult = await client.query<{id: string, current_quantity: number}>(
			// 	'SELECT id, quantity AS current_quantity FROM store_items WHERE id = $1 FOR UPDATE',
			// 	[id]
			// );

			// if (lockResult.rows.length === 0) {
			// 	throw new Error(`StoreItem not found for id: ${id}`);
			// }

			// const newQuantity = lockResult.rows[0].current_quantity + quantityDelta;

			// if (newQuantity < 0) {
			// throw new Error('Final quantity cannot be negative');
			// }

			//Does not delete
			// if (newQuantity === 0) {
			// 	// If the new quantity is zero, delete the row
			// 	const deleteResult = await this.deleteStoreItemById(lockResult.rows[0].id, client);
		
			// 	if (shouldReleaseClient) {
			// 	await client.query('COMMIT');
			// 	}
		
			// 	return deleteResult;
			// }
		
			const storeItemResult = await client.query<StoreItemEntity>(
				'UPDATE store_items SET quantity = quantity + $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[quantityDelta, id]
				);


			// Check if result is valid
			if (!storeItemResult || storeItemResult.rows.length === 0) {
				throw new Error('There was an error updating the storeItem');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = storeItemResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating storeItem:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Deletes the specified storeItem from the database. Returns the deleted row.
	 * @id the id of the storeItem
	 * @returns a StoreItemEntity with the new data on success (or throws error)
	 */
	async deleteStoreItemById(id: string, client?: PoolClient): Promise<StoreItemEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			const deleteResult = await client.query<StoreItemEntity>(
				'DELETE FROM store_items WHERE id = $1 RETURNING id, owner, identifier, quantity',
				[id]
			);
		
			if (shouldReleaseClient) {
				await client.query('COMMIT');
			}
		
			return deleteResult.rows[0];
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error deleting storeItem:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Deletes the specified storeItem from the database. Returns the deleted row.
	 * @ownerId the id of the owner
	 * @identifier the item template id
	 * @returns a StoreItemEntity with the new data on success (or throws error)
	 */
	async deleteStoreItemByOwnerId(ownerId: string, identifier: string, client?: PoolClient): Promise<StoreItemEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			const deleteResult = await client.query<StoreItemEntity>(
				'DELETE FROM store_items WHERE owner = $1 AND identifier = $2 RETURNING id, owner, identifier, quantity',
				[ownerId, identifier]
			);
		
			if (shouldReleaseClient) {
				await client.query('COMMIT');
			}
		
			return deleteResult.rows[0];
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error deleting storeItem:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}
}

const storeItemRepository = new StoreItemRepository();
export default storeItemRepository;