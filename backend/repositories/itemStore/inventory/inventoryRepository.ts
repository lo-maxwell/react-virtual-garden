import { pool, query } from "@/backend/connection/db";
import { InventoryEntity, Inventory } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import { stocklistFactory } from "@/models/itemStore/store/StocklistFactory";
import assert from "assert";
import { PoolClient } from 'pg';
import inventoryItemRepository from "../../items/inventoryItem/inventoryItemRepository";

class InventoryRepository {

	/** Gets the inventory items given an inventory id, from the attached database */
	async getInventoryItems(id: string): Promise<ItemList> {
		const itemResults = await inventoryItemRepository.getAllInventoryItemsByOwnerId(id);
		const items = new ItemList();
		for (const itemResult of itemResults) {
			try {
				const item = inventoryItemRepository.makeInventoryItemObject(itemResult);
				items.addItem(item, item.getQuantity());
			} catch (error) {
				console.error(`Failure while initializing items for inventory from database: `);
				console.error(error);
			}
		}
		return items;
	}

	validateInventoryEntity(inventoryEntity: any): boolean {
		if (!inventoryEntity || (typeof inventoryEntity.id !== 'string')|| (typeof inventoryEntity.owner !== 'string') || (typeof inventoryEntity.gold !== 'number')) {
			console.error(inventoryEntity);
			throw new Error(`Invalid types while creating Inventory`);
		}
		return true;
	}

	/**
	 * Turns a inventoryEntity into a Inventory object.
	 */
	 async makeInventoryObject(inventoryEntity: InventoryEntity, itemList: ItemList | null): Promise<Inventory> {
		assert(this.validateInventoryEntity(inventoryEntity), 'InventoryEntity validation failed');
		//TODO: Fetches all relevant data from database and uses it to construct user
		// let itemList: ItemList = await this.getInventoryItems(inventoryEntity.id);
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
	async createInventory(userId: string, inventory: Inventory, client?: PoolClient): Promise<InventoryEntity> {
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
	 * If the inventory does not exist, creates it for the user. Otherwise, modifies its gold.
	 * @userId the id of the user the inventory belongs to
	 * @inventory the inventory
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new InventoryEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdateInventory(userId: string, inventory: Inventory, client?: PoolClient): Promise<InventoryEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			// Check if the inventory already exists
			const existingInventoryResult = await client.query<{id: string}>(
				'SELECT id FROM inventories WHERE id = $1',
				[inventory.getInventoryId()]
			);

			let result;

			if (existingInventoryResult.rows.length > 0) {
				// Inventory already exists
				result = await this.setInventoryGold(inventory.getInventoryId(), inventory.getGold(), client);
				if (!result) {
					throw new Error(`Error updating inventory with id ${inventory.getInventoryId()}`);
				} 
			} else {
				result = await this.createInventory(userId, inventory, client);
				if (!result) {
					throw new Error(`Error creating inventory with id ${inventory.getInventoryId()}`);
				} 
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			return result;
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
	async setInventoryGold(id: string, newGold: number, client?: PoolClient): Promise<InventoryEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
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
	async updateInventoryGold(id: string, goldDelta: number, client?: PoolClient): Promise<InventoryEntity> {
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