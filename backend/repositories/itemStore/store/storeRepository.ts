import { query, pool } from "@/backend/connection/db";
import { ItemList } from "@/models/itemStore/ItemList";
import { stocklistFactory } from "@/models/itemStore/store/StocklistFactory";
import { StoreEntity, Store } from "@/models/itemStore/store/Store";
import { storeFactory } from "@/models/itemStore/store/StoreFactory";
import { PoolClient } from 'pg';
import storeItemRepository from "../../items/inventoryItem/storeItemRepository";

class StoreRepository {

	async getStoreItems(id: string): Promise<ItemList | null> {
		const itemResults = await storeItemRepository.getAllStoreItemsByOwnerId(id);
		const items = new ItemList();
		for (const itemResult of itemResults) {
			try {
				const item = storeItemRepository.makeStoreItemObject(itemResult);
				items.addItem(item.itemData, item.getQuantity());
			} catch (error) {
				console.error(`Failure while initializing items for store from database: `);
				console.error(error);
			}
		}
		return items;
	}

	/**
	 * Turns a storeEntity into a Store object.
	 */
	async makeStoreObject(storeEntity: StoreEntity): Promise<Store> {
		if (!storeEntity || (typeof storeEntity.id !== 'string') || (typeof storeEntity.identifier !== 'number') || (typeof storeEntity.last_restock_time_ms !== 'string')) {
			console.error(storeEntity);
			throw new Error(`Invalid types while creating Store`);
		}
		//TODO: Fetches all relevant data from database and uses it to construct user
		let itemList: ItemList | null = await this.getStoreItems(storeEntity.id);
		if (!itemList) itemList = new ItemList();
		const storeData = storeFactory.getStoreInterfaceById(storeEntity.identifier);
		if (!storeData) {
			console.error(storeEntity);
			throw new Error(`Invalid store identifier, could not find corresponding store index`);
		}
		const stocklist = stocklistFactory.getStocklistInterfaceById(storeData.stocklistId);
		if (!stocklist) {
			throw new Error(`Invalid stocklist id, could not find corresponding stocklist`);
		}
		return new Store(storeEntity.id, storeData.id, storeData.name, storeData.buyMultiplier, storeData.sellMultiplier, storeData.upgradeMultiplier, itemList, stocklist.items, storeEntity.last_restock_time_ms, storeData.restockInterval);
	}

	/**
	 * Returns a list of all Stores from the stores table.
	 * May throw errors if the query is misshapped.
	 * @returns StoreEntity[]
	 */
	async getAllStores(): Promise<StoreEntity[]> {
		const result = await query<StoreEntity>('SELECT * FROM stores', []);
		if (!result || result.rows.length === 0) return [];
		return result.rows;
		// const toReturn: Store[] = await Promise.all(result.rows.map((row) => makeStoreObject(row.id, row.identifier, row.last_restock_time_ms)));
		// return toReturn;
	}

	/**
	 * Given its id, returns the row data of a store from the database.
	 * @id the id of the store in the database
	 */
	async getStoreById(id: string): Promise<StoreEntity | null> {
		const result = await query<StoreEntity>('SELECT * FROM stores WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const storeRecord = result.rows[0];
		return storeRecord;
		// const instance = makeStoreObject(storeRecord.id, storeRecord.identifier, storeRecord.last_restock_time_ms);
		// return instance;
	}

	/**
	 * Given a user id, returns the row data of a store from the database.
	 * @userId the user id
	 */
	async getStoreByOwnerId(userId: string): Promise<StoreEntity | null> {
		const result = await query<StoreEntity>('SELECT * FROM stores WHERE owner = $1', [userId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const storeRecord = result.rows[0];
		return storeRecord;
		// const instance = makeStoreObject(storeRecord.id, storeRecord.identifier, storeRecord.last_restock_time_ms);
		// return instance;
	}


	/**
	 * Begins a transaction if there is not already one. Creates a new store row.
	 * On error, rolls back.
	 * @ownerId the user id of the owner of this store
	 * @store the store to pull data from
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new Store with the corresponding data if success, null if failure (or throws error)
	 */
	async createStore(ownerId: string, store: Store, client?: PoolClient): Promise<StoreEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			// Check if the store already exists
			const existingStoreResult = await client.query<StoreEntity>(
				'SELECT id, owner, identifier, last_restock_time_ms FROM stores WHERE owner = $1',
				[ownerId]
			);

			if (existingStoreResult.rows.length > 0) {
				// Inventory already exists
				console.warn(`Store already exists for user ${ownerId} with this ID: ${existingStoreResult.rows[0].id}`);
				return existingStoreResult.rows[0];
				// return makeStoreObject(existingStoreResult.rows[0].id, existingStoreResult.rows[0].identifier, existingStoreResult.rows[0].last_restock_time_ms); 
			}
		
			const result = await query<StoreEntity>(
				'INSERT INTO stores (id, owner, identifier, last_restock_time_ms) VALUES ($1, $2, $3, $4) RETURNING *',
				[store.getStoreId(), ownerId, store.getStoreIdentifier(), store.getRestockTime().toString()]
				);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('Failed to insert store');
			}

			//Create store items
			const storeItemPromises: Promise<void>[] = []; // Array to store promises
			const storeItems = store.getAllItems();
			storeItems.forEach((item) => {
				// Create a promise for each inventoryItem creation and store it in the array
				const storeItemPromise = storeItemRepository.createStoreItem(result.rows[0].id, item, client)
					.then((storeItemResult) => {
						if (!storeItemResult) {
							throw new Error(`Error creating store item for item ${item.itemData.id}`);
						}
					});
				storeItemPromises.push(storeItemPromise);
			});

			// Wait for all storeItem creation promises to resolve
			await Promise.allSettled(storeItemPromises);

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			// Return the created Store as an instance
			const storeRecord = result.rows[0];
			return storeRecord;
			// const instance = makeStoreObject(storeRecord.id, storeRecord.identifier, storeRecord.last_restock_time_ms);
			// return instance;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating store:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * Sets the identifier of the store. Uses row level locking.
	 * @id the id of the store
	 * @newIdentifier the new identifier
	 * @returns a StoreEntity with the new data on success (or throws error)
	 */
	async setStoreIdentifier(id: string, newIdentifier: number, client?: PoolClient): Promise<StoreEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const lockResult = await client.query<StoreEntity>(
				'SELECT owner, identifier, last_restock_time_ms FROM stores WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Store with id ${id} not found in database`);
			}
		
			const storeResult = await client.query<StoreEntity>(
				'UPDATE stores SET identifier = $1 WHERE id = $2 RETURNING owner, identifier, last_restock_time_ms',
				[newIdentifier, id]
				);


			// Check if result is valid
			if (!storeResult || storeResult.rows.length === 0) {
				throw new Error(`There was an error updating the store with id ${id}`);
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = storeResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating store identifier:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Sets the last restock time of the store. Uses row level locking.
	 * @id the store id
	 * @newRestockTime the new restock time, should usually use Date.now()
	 * @returns a StoreEntity with the new data on success (or throws error)
	 */
	async setStoreLastRestockTime(id: string, newRestockTime: number, client?: PoolClient): Promise<StoreEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const lockResult = await client.query<StoreEntity>(
				'SELECT owner, identifier, last_restock_time_ms FROM stores WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Store for owner ${id} not found in database`);
			}
		
			const storeResult = await client.query<StoreEntity>(
				'UPDATE stores SET last_restock_time_ms = $1 WHERE id = $2 RETURNING owner, identifier, last_restock_time_ms',
				[newRestockTime, id]
				);


			// Check if result is valid
			if (!storeResult || storeResult.rows.length === 0) {
				throw new Error(`There was an error updating the store with id ${id}`);
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = storeResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating store last restock time:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}
}

const storeRepository = new StoreRepository();
export default storeRepository;