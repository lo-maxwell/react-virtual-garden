import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import ItemHistory, { ItemHistoryEntity } from "@/models/user/history/itemHistory/ItemHistory";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import { query } from "@/backend/connection/db";
import { PoolClient } from "pg";
import { transactionWrapper } from "@/backend/services/utility/utility";
import assert from "assert";

class ItemHistoryRepository {
	/**
	 * Ensures that the object is of type ItemHistoryEntity, ie. that it contains an id, owner, identifier, and quantity
	 */
	 validateItemHistoryEntity(itemHistoryEntity: any): boolean {
		if (!itemHistoryEntity || (typeof itemHistoryEntity.id !== 'string') || (typeof itemHistoryEntity.owner !== 'string') || (typeof itemHistoryEntity.identifier !== 'string') || (typeof itemHistoryEntity.quantity !== 'number')) {
			throw new Error(`Invalid types while creating ItemHistory from ItemHistoryEntity`);
		}
		return true;
	}

	makeItemHistoryObject(itemHistoryEntity: ItemHistoryEntity): ItemHistory {
		assert(this.validateItemHistoryEntity(itemHistoryEntity));
		
		const itemHistoryTemplate = placeholderItemTemplates.getTemplate(itemHistoryEntity.identifier);
		if (!itemHistoryTemplate) {
			throw new Error(`Could not find item history template matching identifier ${itemHistoryEntity.identifier}`);
		}
		return new ItemHistory(itemHistoryEntity.id, itemHistoryTemplate, itemHistoryEntity.quantity);
	}

	makeItemHistoryListObject(itemHistories: ItemHistory[]): ItemHistoryList {
		// const histories = await this.getItemHistoriesByUserId(userId);
		// if (!histories) {
		// 	return new ItemHistoryList();
		// }
		const result = new ItemHistoryList();

		// const promises = histories.map(itemHistory => this.makeItemHistoryObject(itemHistory)); // Collect promises
		// const itemHistories = await Promise.all(promises);

		for (const itemHistory of itemHistories) {
			result.addItemHistory(itemHistory);
		}

		return result;
	}

	/**
	 * Returns a list of all item histories from the itemHistories table.
	 * This is very expensive.
	 * May throw errors if the query is misshapped.
	 * @returns ItemHistory[]
	 */
	async getAllItemHistories(): Promise<ItemHistoryEntity[]> {
		const result = await query<ItemHistoryEntity>('SELECT * FROM item_histories', []);
		if (!result || result.rows.length === 0) return [];
		return result.rows;
	}

	async getItemHistoryById(id: string): Promise<ItemHistoryEntity | null> {
		const result = await query<ItemHistoryEntity>('SELECT * FROM item_histories WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
	}

	async getItemHistoryByUserAndIdentifier(userId: string, identifier: string): Promise<ItemHistoryEntity | null> {
		const result = await query<ItemHistoryEntity>('SELECT * FROM item_histories WHERE owner = $1 AND identifier = $2', [userId, identifier]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
	}

	async getItemHistoriesByIdentifier(searchIdentifier: string): Promise<ItemHistoryEntity[]> {
		const result = await query<ItemHistoryEntity>('SELECT * FROM item_histories WHERE identifier = $1', [searchIdentifier]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		return result.rows;
	}

	async getItemHistoriesByUserId(userId: string): Promise<ItemHistoryEntity[]> {
		const result = await query<ItemHistoryEntity>('SELECT * FROM item_histories WHERE owner = $1', [userId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		
		return result.rows;
	}

	/**
	 * Begins a transaction if there is not already one. Creates an item history entry in the database.
	 * On error, rolls back.
	 * @itemHistory the ItemHistory to add
	 * @userId the owner of the itemHistory
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns the ItemHistoryEntity if success, null if failure (or throws error)
	 */
	async createItemHistory(itemHistory: ItemHistory, userId: string, client?: PoolClient): Promise<ItemHistoryEntity> {
		const innerFunction = async (client: PoolClient): Promise<ItemHistoryEntity> => {
			// Check if the item history already exists
			const existingItemHistoryResult = await client.query<ItemHistoryEntity>(
				'SELECT id, owner, identifier, quantity FROM item_histories WHERE owner = $1 AND identifier = $2',
				[userId, itemHistory.getItemData().id] // Lookup by owner and identifier
			);

			if (existingItemHistoryResult.rows.length > 0) {
				// Item history already exists
				console.warn(`Item history already exists with this ID: ${existingItemHistoryResult.rows[0].id}`);
				return existingItemHistoryResult.rows[0];
			}

			const itemHistoryResult = await client.query<ItemHistoryEntity>(
				'INSERT INTO item_histories (id, owner, identifier, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
				[itemHistory.getItemHistoryId(), userId, itemHistory.getItemData().id, itemHistory.getQuantity()]
			);

			// Check if result is valid
			if (!itemHistoryResult || itemHistoryResult.rows.length === 0) {
				throw new Error('There was an error creating the item history');
			}

			return itemHistoryResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createItemHistory', client);
	}

	async createOrUpdateItemHistory(itemHistory: ItemHistory, userId: string, client?: PoolClient): Promise<ItemHistoryEntity> {
		const innerFunction = async (client: PoolClient): Promise<ItemHistoryEntity> => {
			// Check if the item history already exists
			const existingItemHistoryResult = await client.query<{id: string}>(
				'SELECT id FROM item_histories WHERE owner = $1 AND identifier = $2',
				[userId, itemHistory.getItemData().id] // Lookup by owner and identifier
			);

			let result;

			if (existingItemHistoryResult.rows.length > 0) {
				// Item history already exists
				result = await this.updateEntireItemHistory(existingItemHistoryResult.rows[0].id, userId, itemHistory.getItemData().id, itemHistory.getQuantity()); // Pass client to update function
				if (!result) {
					throw new Error(`Error updating item history with id ${itemHistory.getItemHistoryId()}`);
				} 
			} else {
				result = await this.createItemHistory(itemHistory, userId, client);
				if (!result) {
					throw new Error(`Error creating item history with id ${itemHistory.getItemHistoryId()}`);
				} 
			}

			return result;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createOrUpdateItemHistory', client);
	}

    /**
	 * Adds an item history to the database. If the item history already exists, adds to its quantity. Otherwise, creates a new row. Begins a transaction if there is not already one. 
	 * On error, rolls back.
	 * @userId the id of the owner of itemHistory. If the owner cannot be found, fails.
	 * @itemHistory the itemHistory used to create this entity
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a ItemHistoryEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async addItemHistory(userId: string, itemHistory: ItemHistory, client?: PoolClient): Promise<ItemHistoryEntity> {
		if (itemHistory.getQuantity() <= 0) {
			throw new Error(`Cannot add item history with quantity ${itemHistory.getQuantity()}`);
		}
		
		const innerFunction = async (client: PoolClient): Promise<ItemHistoryEntity> => {
			// Check if the itemHistory already exists
			const existingItemHistoryResult = await this.getItemHistoryByUserAndIdentifier(userId, itemHistory.getItemData().id);

			if (existingItemHistoryResult) {
				// ItemHistory already exists
				const updateResult = await this.updateItemHistoryQuantity(existingItemHistoryResult.id, itemHistory.getQuantity(), client);
				if (!updateResult) {
					throw new Error(`Failed to update quantity while adding item history with id ${existingItemHistoryResult.id}`);
				}
				return updateResult;
			}
			
			const result = await this.createItemHistory(itemHistory, userId, client);

			// Check if result is valid
			if (!result) {
				throw new Error('There was an error creating the item history');
			}

			// Return the created ItemHistory as an instance
			return result;
		}
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addItemHistory', client);
	}

	/**
	 * Changes all data fields for a specified item history (owner, identifier, quantity)
	 * @itemHistory the itemHistory to update
	 * @returns a ItemHistoryEntity with the new data on success (or throws error)
	 */
	async updateEntireItemHistory(historyId: string, userId: string, newIdentifier: string, newQuantity: number): Promise<ItemHistoryEntity> {
		const itemHistoryResult = await query<ItemHistoryEntity>(
			'UPDATE item_histories SET identifier = $1, quantity = $2 WHERE id = $3 AND owner = $4 RETURNING id, owner, identifier, quantity',
			[newIdentifier, newQuantity, historyId, userId]
		);

		// Check if result is valid
		if (!itemHistoryResult || itemHistoryResult.rows.length === 0) {
			throw new Error(`Could not find item history for id ${historyId}`);
		}

		const updatedRow = itemHistoryResult.rows[0];
		return updatedRow;
	}

	/**
	 * Sets the quantity of the ItemHistory. Does not validate quantity amount, except for checking that it is nonnegative. Uses row level locking.
	 * @id the id of the itemHistory
	 * @newQuantity the new quantity
	 * @returns a ItemHistoryEntity with the new data on success (or throws error)
	 */
	async setItemHistoryQuantity(id: string, newQuantity: number, client?: PoolClient): Promise<ItemHistoryEntity> {
		const innerFunction = async (client: PoolClient): Promise<ItemHistoryEntity> => {
			const itemHistoryResult = await client.query<ItemHistoryEntity>(
				'UPDATE item_histories SET quantity = $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[newQuantity, id]
			);

			// Check if result is valid
			if (!itemHistoryResult || itemHistoryResult.rows.length === 0) {
				throw new Error('There was an error updating the item history');
			}

			return itemHistoryResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setItemHistoryQuantity', client);
	}

	/**
	 * Updates the quantity of the ItemHistory. Does not validate quantity amount, except that the result must be nonnegative. Uses row level locking.
	 * @id the id of the itemHistory
	 * @quantityDelta the quantity change
	 * @returns a ItemHistoryEntity with the new data on success (or throws error)
	 */
	async updateItemHistoryQuantity(id: string, quantityDelta: number, client?: PoolClient): Promise<ItemHistoryEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<ItemHistoryEntity> => {
			const itemHistoryResult = await client.query<ItemHistoryEntity>(
				'UPDATE item_histories SET quantity = quantity + $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[quantityDelta, id]
			);

			// Check if result is valid
			if (!itemHistoryResult || itemHistoryResult.rows.length === 0) {
				throw new Error('There was an error updating the item history');
			}

			const updatedRow = itemHistoryResult.rows[0];
			return updatedRow;
		}; 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updateItemHistoryQuantity', client);
	}

}

const itemHistoryRepository = new ItemHistoryRepository();
export default itemHistoryRepository;
