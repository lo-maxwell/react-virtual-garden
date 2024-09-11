import { pool, query } from "@/backend/connection/db";
import { Inventory, InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import { PoolClient } from 'pg';
import inventoryItemRepository from "../../items/inventoryItem/inventoryItemRepository";

class InventoryRepository {

	async getInventoryItems(id: string): Promise<ItemList | null> {
		const itemResults = await inventoryItemRepository.getAllInventoryItemsByOwnerId(id);
		const items = new ItemList();
		for (const itemResult of itemResults) {
			try {
				const item = inventoryItemRepository.makeInventoryItemObject(itemResult);
				items.addItem(item.itemData, item.getQuantity());
			} catch (error) {
				console.error(`Failure while initializing items for inventory from database: `);
				console.error(error);
			}
		}
		return items;
	}

	/**
	 * Turns an inventoryEntity into an Inventory object.
	 */
	async makeInventoryObject(inventoryEntity: InventoryEntity): Promise<Inventory> {
		if (!inventoryEntity || (typeof inventoryEntity.id !== 'string') || (typeof inventoryEntity.gold !== 'number')) {
			console.error(inventoryEntity);
			throw new Error(`Invalid types while creating Inventory`);
		}
		//TODO: Fetches all relevant data from database and uses it to construct user
		let itemList: ItemList | null = await this.getInventoryItems(inventoryEntity.id);
		if (!itemList) itemList = new ItemList();
		return new Inventory(inventoryEntity.id, '', inventoryEntity.gold, itemList);
	}

	/**
	 * Returns a list of all Inventories from the inventories table.
	 * May throw errors if the query is misshapped.
	 * @returns Inventory[]
	 */
	async getAllInventories(): Promise<InventoryEntity[]> {
		const result = await query<InventoryEntity>('SELECT id, gold FROM inventories', []);
		if (!result || result.rows.length === 0) return [];
		return result.rows;
		// const toReturn: Inventory[] = await Promise.all(result.rows.map((row) => makeInventoryObject(row.id, row.gold)));
		// return toReturn;
	}

	/**
	 * Given its id, returns the row data of an inventory from the database.
	 * @id the id of the inventory in the database
	 */
	async getInventoryById(id: string): Promise<InventoryEntity | null> {
		const result = await query<InventoryEntity>('SELECT * FROM inventories WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const inventoryRecord = result.rows[0];
		return inventoryRecord;
		// const instance = makeInventoryObject(inventoryRecord.id, inventoryRecord.gold);
		// return instance;
	}

	/**
	 * Given a user id, returns the row data of an inventory from the database.
	 * @userId the user id
	 */
	async getInventoryByOwnerId(userId: string): Promise<InventoryEntity | null> {
		const result = await query<InventoryEntity>('SELECT * FROM inventories WHERE owner = $1', [userId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const inventoryRecord = result.rows[0];
		return inventoryRecord;
		// const instance = makeInventoryObject(inventoryRecord.id, inventoryRecord.gold);
		// return instance;
	}


	/**
	 * Begins a transaction if there is not already one. Creates a new inventory row.
	 * On error, rolls back.
	 * @userId the user id of the owner of this inventory
	 * @inventory the inventory to pull data from
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new Inventory with the corresponding data if success, null if failure (or throws error)
	 */
	async createInventory(userId: string, inventory: Inventory, client?: PoolClient): Promise<InventoryEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			// Check if the inventory already exists
			const existingInventoryResult = await client.query<InventoryEntity>(
				'SELECT id, owner, gold FROM inventories WHERE owner = $1',
				[userId]
			);

			if (existingInventoryResult.rows.length > 0) {
				// Inventory already exists
				console.warn(`Inventory already exists for user ${userId} with this ID: ${existingInventoryResult.rows[0].id}`);
				return existingInventoryResult.rows[0];
				// return makeInventoryObject(existingInventoryResult.rows[0].id, existingInventoryResult.rows[0].gold); 
			}
		
			const result = await query<InventoryEntity>(
				'INSERT INTO inventories (id, owner, gold) VALUES ($1, $2, $3) RETURNING *',
				[inventory.getInventoryId(), userId, inventory.getGold()]
				);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('Failed to insert inventory');
			}

			//Create inventory items
			const inventoryItemPromises: Promise<void>[] = []; // Array to store promises
			const inventoryItems = inventory.getAllItems();
			inventoryItems.forEach((item) => {
				// Create a promise for each inventoryItem creation and store it in the array
				const inventoryItemPromise = inventoryItemRepository.createInventoryItem(result.rows[0].id, item, client)
					.then((inventoryItemResult) => {
						if (!inventoryItemResult) {
							throw new Error(`Error creating inventory item for item ${item.itemData.id}`);
						}
					});
				inventoryItemPromises.push(inventoryItemPromise);
			});

			// Wait for all inventoryItem creation promises to resolve
			await Promise.allSettled(inventoryItemPromises);

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			// Return the created Inventory as an instance
			const inventoryRecord = result.rows[0];
			return inventoryRecord;
			// const instance = makeInventoryObject(inventoryRecord.id, inventoryRecord.gold);
			// return instance;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating inventory:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Sets the gold of the inventory. Uses row level locking.
	 * @id the id of the inventory
	 * @newGold the new gold amount of the inventory
	 * @client optional client for nested transactions
	 * @returns a InventoryEntity with the new data on success (or throws error)
	 */
	async setInventoryGold(id: string, newGold: number, client?: PoolClient): Promise<InventoryEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const inventoryLockResult = await client.query<{id: string}>(
				'SELECT id FROM inventories WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (inventoryLockResult.rows.length === 0) {
				throw new Error('Inventory not found');
			}
		
			const InventoryResult = await client.query<InventoryEntity>(
				'UPDATE inventories SET gold = $1 WHERE id = $2 RETURNING id, owner, gold',
				[newGold, id]
				);


			// Check if result is valid
			if (!InventoryResult || InventoryResult.rows.length === 0) {
				throw new Error('There was an error updating the inventory');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = InventoryResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating inventory:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * Changes the amount of gold in the inventory by an amount. Does not verify that gold is positive. Uses row level locking.
	 * @id the id of the inventory
	 * @goldDelta the amount of gold to change by
	 * @client optional client for nested transactions
	 * @returns a InventoryEntity with the new data on success (or throws error)
	 */
	async updateInventoryGold(id: string, goldDelta: number, client?: PoolClient): Promise<InventoryEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const inventoryLockResult = await client.query<{id: string}>(
				'SELECT id FROM inventories WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (inventoryLockResult.rows.length === 0) {
				throw new Error('Inventory not found');
			}
		
			const InventoryResult = await client.query<InventoryEntity>(
				'UPDATE inventories SET gold = gold + $1 WHERE id = $2 RETURNING id, owner, gold',
				[goldDelta, id]
				);


			// Check if result is valid
			if (!InventoryResult || InventoryResult.rows.length === 0) {
				throw new Error('There was an error updating the inventory');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = InventoryResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating inventory gold:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


}

const inventoryRepository = new InventoryRepository();
export default inventoryRepository;