import { query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import ActionHistory, { ActionHistoryEntity } from "@/models/user/history/actionHistory/ActionHistory";
import { actionHistoryMetadataRepository } from "@/models/user/history/actionHistory/ActionHistoryMetadataRepository";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";
import { assert } from "console";
import { PoolClient } from 'pg';

class ActionHistoryRepository {

	/**
	 * Ensures that the object is of type ActionHistoryEntity, ie. that it contains an id, owner, identifier, and quantity
	 */
	validateActionHistoryEntity(actionHistoryEntity: any): boolean {
		if (!actionHistoryEntity || (typeof actionHistoryEntity.id !== 'string') || (typeof actionHistoryEntity.owner !== 'string') || (typeof actionHistoryEntity.identifier !== 'string') || (typeof actionHistoryEntity.quantity !== 'number')) {
			console.warn(actionHistoryEntity);
			throw new Error(`Invalid types while creating ActionHistory from ActionHistoryEntity`);
		}
		return true;
	}

	makeActionHistoryObject(actionHistoryEntity: ActionHistoryEntity): ActionHistory {
		assert(this.validateActionHistoryEntity(actionHistoryEntity));
		
		const actionHistoryInterface = actionHistoryMetadataRepository.getActionHistoryInterfaceByIdentifierString(actionHistoryEntity.identifier);
		if (!actionHistoryInterface) {
			throw new Error(`Could not find action history matching identifier ${actionHistoryEntity.identifier}`);
		}
		return new ActionHistory(actionHistoryEntity.id, actionHistoryInterface.name, actionHistoryInterface.description, actionHistoryInterface.identifier, actionHistoryEntity.quantity);
	}

	makeActionHistoryListObject(actionHistories: ActionHistory[]): ActionHistoryList {
		// const histories = await this.getActionHistoriesByUserId(userId);
		// if (!histories) {
		// 	return new ActionHistoryList();
		// }
		const result = new ActionHistoryList();

		// const actionHistories = histories.map(actionHistory => this.makeActionHistoryObject(actionHistory)); // Collect promises
		for (const actionHistory of actionHistories) {
			result.addActionHistory(actionHistory);
		}

		return result;
	}

	/**
	 * Returns a list of all action histories from the actionHistories table.
	 * This is very expensive.
	 * May throw errors if the query is misshapped.
	 * @returns ActionHistory[]
	 */
	async getAllActionHistories(): Promise<ActionHistoryEntity[]> {
		const result = await query<ActionHistoryEntity>('SELECT * FROM action_histories', []);
		if (!result || result.rows.length === 0) return [];
		return result.rows;
	}

	async getActionHistoryById(id: string): Promise<ActionHistoryEntity | null> {
		const result = await query<ActionHistoryEntity>('SELECT * FROM action_histories WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
	}

	async getActionHistoryByUserAndIdentifier(userId: string, identifier: string): Promise<ActionHistoryEntity | null> {
		const result = await query<ActionHistoryEntity>('SELECT * FROM action_histories WHERE owner = $1 AND identifier = $2', [userId, identifier]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
	}

	async getActionHistoriesByIdentifier(searchIdentifier: string): Promise<ActionHistoryEntity[]> {
		const result = await query<ActionHistoryEntity>('SELECT * FROM action_histories WHERE identifier = $1', [searchIdentifier]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		return result.rows;
	}

	async getActionHistoriesByUserId(userId: string): Promise<ActionHistoryEntity[]> {
		const result = await query<ActionHistoryEntity>('SELECT * FROM action_histories WHERE owner = $1', [userId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		
		return result.rows;
	}

	/**
	 * Begins a transaction if there is not already one. Creates an action history entry in the database.
	 * On error, rolls back.
	 * @actionHistory the ActionHistory to add
	 * @userId the owner of the actionHistory
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns the ActionHistoryEntity if success, null if failure (or throws error)
	 */
	async createActionHistory(actionHistory: ActionHistory, userId: string, client?: PoolClient): Promise<ActionHistoryEntity> {
		const innerFunction = async (client: PoolClient): Promise<ActionHistoryEntity> => {
			// Check if the action history already exists
			const existingActionHistoryResult = await client.query<ActionHistoryEntity>(
				'SELECT id FROM action_histories WHERE owner = $1 AND identifier = $2',
				[userId, actionHistory.getIdentifier()] // Lookup by owner and identifier
			);

			if (existingActionHistoryResult.rows.length > 0) {
				// Action history already exists
				console.warn(`Action history already exists with this ID: ${existingActionHistoryResult.rows[0].id}`);
				return existingActionHistoryResult.rows[0];
			}

			const actionHistoryResult = await client.query<ActionHistoryEntity>(
				'INSERT INTO action_histories (id, owner, identifier, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
				[actionHistory.getActionHistoryId(), userId, actionHistory.getIdentifier(), actionHistory.getQuantity()]
			);

			// Check if result is valid
			if (!actionHistoryResult || actionHistoryResult.rows.length === 0) {
				throw new Error('There was an error creating the action history');
			}

			return actionHistoryResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createActionHistory', client);
	}

	async createOrUpdateActionHistory(actionHistory: ActionHistory, userId: string, client?: PoolClient): Promise<ActionHistoryEntity> {
		const innerFunction = async (client: PoolClient): Promise<ActionHistoryEntity> => {
			// Check if the action history already exists
			const existingActionHistoryResult = await client.query<{id: string}>(
				'SELECT id FROM action_histories WHERE owner = $1 AND identifier = $2',
				[userId, actionHistory.getIdentifier()] // Lookup by owner and identifier
			);

			let result;

			if (existingActionHistoryResult.rows.length > 0) {
				// Action history already exists
				result = await this.updateEntireActionHistory(existingActionHistoryResult.rows[0].id, userId, actionHistory.getIdentifier(), actionHistory.getQuantity()); // Pass client to update function
				if (!result) {
					throw new Error(`Error updating action history with id ${actionHistory.getActionHistoryId()}`);
				} 
			} else {
				result = await this.createActionHistory(actionHistory, userId, client);
				if (!result) {
					throw new Error(`Error creating action history with id ${actionHistory.getActionHistoryId()}`);
				} 
			}

			return result;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createOrUpdateActionHistory', client);
	}

	/**
	 * Adds an action history to the database. If the action history already exists, adds to its quantity. Otherwise, creates a new row. Begins a transaction if there is not already one. 
	 * On error, rolls back.
	 * @userId the id of the owner of actionHistory. If the owner cannot be found, fails.
	 * @actionHistory the actionHistory used to create this entity
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a ActionHistoryEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async addActionHistory(userId: string, actionHistory: ActionHistory, client?: PoolClient): Promise<ActionHistoryEntity> {
		if (actionHistory.getQuantity() <= 0) {
			throw new Error(`Cannot add action history with quantity ${actionHistory.getQuantity()}`);
		}
		
		const innerFunction = async (client: PoolClient): Promise<ActionHistoryEntity> => {
			// Check if the actionHistory already exists
			const existingActionHistoryResult = await this.getActionHistoryByUserAndIdentifier(userId, actionHistory.getIdentifier());

			if (existingActionHistoryResult) {
				// ActionHistory already exists
				const updateResult = await this.updateActionHistoryQuantity(existingActionHistoryResult.id, actionHistory.getQuantity(), client);
				if (!updateResult) {
					throw new Error(`Failed to update quantity while adding action history with id ${existingActionHistoryResult.id}`);
				}
				return updateResult;
			}
			
			const result = await this.createActionHistory(actionHistory, userId, client);

			// Check if result is valid
			if (!result) {
				throw new Error('There was an error creating the action history');
			}

			// Return the created ActionHistory as an instance
			return result;
		}
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addActionHistory', client);
	}

	/**
	 * Changes all data fields for a specified action history (identifier, quantity). verifies with owner id.
	 * @historyId the id of the history to modify
	 * @userId the id of the owner of the history
	 * @newQuantity the quantity to set as
	 * @returns a ActionHistoryEntity with the new data on success (or throws error)
	 */
	async updateEntireActionHistory(historyId: string, userId: string, newIdentifier: string, newQuantity: number): Promise<ActionHistoryEntity> {
		const actionHistoryResult = await query<ActionHistoryEntity>(
			'UPDATE action_histories SET identifier = $1, quantity = $2 WHERE id = $3 AND owner = $4 RETURNING id, owner, identifier, quantity',
			[newIdentifier, newQuantity, historyId, userId]
		);

		// Check if result is valid
		if (!actionHistoryResult || actionHistoryResult.rows.length === 0) {
			throw new Error(`Could not find action history for id ${historyId}`);
		}

		const updatedRow = actionHistoryResult.rows[0];
		return updatedRow;
	}

	/**
	 * Sets the quantity of the ActionHistory. Does not validate quantity amount, except for checking that it is nonnegative. Uses row level locking.
	 * @id the id of the actionHistory
	 * @newQuantity the new quantity
	 * @returns a ActionHistoryEntity with the new data on success (or throws error)
	 */
	async setActionHistoryQuantity(id: string, newQuantity: number, client?: PoolClient): Promise<ActionHistoryEntity> {
		const innerFunction = async (client: PoolClient): Promise<ActionHistoryEntity> => {
			const actionHistoryResult = await client.query<ActionHistoryEntity>(
				'UPDATE action_histories SET quantity = $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[newQuantity, id]
			);

			// Check if result is valid
			if (!actionHistoryResult || actionHistoryResult.rows.length === 0) {
				throw new Error('There was an error updating the action history');
			}

			return actionHistoryResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setActionHistoryQuantity', client);
	}

	/**
	 * Updates the quantity of the ActionHistory. Does not validate quantity amount, except that the result must be nonnegative. Uses row level locking.
	 * @id the id of the actionHistory
	 * @quantityDelta the quantity change
	 * @returns a ActionHistoryEntity with the new data on success (or throws error)
	 */
	async updateActionHistoryQuantity(id: string, quantityDelta: number, client?: PoolClient): Promise<ActionHistoryEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<ActionHistoryEntity> => {
			const actionHistoryResult = await client.query<ActionHistoryEntity>(
				'UPDATE action_histories SET quantity = quantity + $1 WHERE id = $2 RETURNING id, owner, identifier, quantity',
				[quantityDelta, id]
			);

			// Check if result is valid
			if (!actionHistoryResult || actionHistoryResult.rows.length === 0) {
				throw new Error('There was an error updating the action history');
			}

			const updatedRow = actionHistoryResult.rows[0];
			return updatedRow;
		}; 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updateActionHistoryQuantity', client);
	}

}

const actionHistoryRepository = new ActionHistoryRepository();
export default actionHistoryRepository;
