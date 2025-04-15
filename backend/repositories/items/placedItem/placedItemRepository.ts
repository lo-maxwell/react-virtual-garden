import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { PlacedItemEntity, PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { EmptyItemTemplate } from "@/models/items/templates/models/EmptyItemTemplate";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { getItemClassFromSubtype } from "@/models/items/utility/classMaps";
import { assert } from "console";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from 'uuid';

class PlacedItemRepository {

	/**
	 * Ensures that the object is of type PlacedItemEntity, ie. that it contains an id, owner, identifier, and status field
	 */
	 validatePlacedItemEntity(placedItemEntity: any): boolean {
		if (!placedItemEntity || (typeof placedItemEntity.id !== 'string') || (typeof placedItemEntity.owner !== 'string') || (typeof placedItemEntity.identifier !== 'string' || (typeof placedItemEntity.status !== 'string'))) {
			console.error(placedItemEntity);
			throw new Error(`Invalid types while creating PlacedItem from PlacedItemEntity`);
		}
		return true;
	}

	makePlacedItemObject(placedItemEntity: PlacedItemEntity): PlacedItem {
		assert(this.validatePlacedItemEntity(placedItemEntity));

		const itemData = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!itemData) {
			console.warn(`Could not find placedItem matching id ${placedItemEntity.identifier}`)
			return new EmptyItem(placedItemEntity.id, EmptyItemTemplate.getErrorTemplate(), 'CRITICAL ERROR');
		}
		const itemClass = getItemClassFromSubtype(itemData);

		const instance = new itemClass(placedItemEntity.id, itemData, placedItemEntity.status);
		if (!(instance instanceof PlacedItem)) {
			console.warn(`Attempted to create non PlacedItem for id ${placedItemEntity.identifier}`);
			return new EmptyItem(placedItemEntity.id, EmptyItemTemplate.getErrorTemplate(), 'CRITICAL ERROR');
		}
		return instance;
	}

	/**
	 * Throws an error. Do not use!
	 * May throw errors if the query is misshapped.
	 * @returns PlacedItemEntity[]
	 */
	async getAllPlacedItems(): Promise<PlacedItemEntity[]> {
		throw new Error('Not implemented yet!');
	}

	/**
	 * Given an id, returns the row data of a placedItem from the database.
	 * @id the id of the placedItem in the database
	 */
	async getPlacedItemById(id: string): Promise<PlacedItemEntity | null> {
		const result = await query<PlacedItemEntity>('SELECT id, owner, identifier, status FROM placed_items WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		return result.rows[0];
		// Return the first item found
		// const instance = makePlacedItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given a plot id, returns the row data of a placedItem from the database.
	 * @plotId the id of the plot in the database
	 */
	async getPlacedItemByPlotId(plotId: string): Promise<PlacedItemEntity | null> {
		const result = await query<PlacedItemEntity>('SELECT id, owner, identifier, status FROM placed_items WHERE owner = $1', [plotId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		return result.rows[0];
		// Return the first item found
		// const instance = makePlacedItemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given an array of plot ids, returns the row data of the respective placed items
	 * @plotIds the ids of the plots in the database
	 */
	async getPlacedItemsByPlotIds(plotIds: string[]): Promise<PlacedItemEntity[]> {
		if (plotIds.length === 0) {
			return []; // Return an empty array if no plot IDs are provided
		}

		// Create a parameterized query with placeholders for each plot ID
		const placeholders = plotIds.map((_, index) => `$${index + 1}`).join(', ');
		const queryText = `SELECT id, owner, identifier, status FROM placed_items WHERE owner IN (${placeholders})`;

		const result = await query<PlacedItemEntity>(queryText, plotIds);
		
		// If no rows are returned, return an empty array
		return result.rows.length > 0 ? result.rows : [];
	}

	/**
	 * Begins a transaction if there is not already one. Creates a new placedItem row.
	 * On error, rolls back.
	 * @plotId the id of the owner (plot) of this placedItem. If the owner cannot be found, fails.
	 * @placedItem the placedItem used to create this object
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a PlacedItemEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createPlacedItem(plotId: string, placedItem: PlacedItem, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			const existingItemResult = await client.query<PlacedItemEntity>(
				`SELECT id, owner, identifier, status FROM placed_items 
				WHERE id = $1 OR owner = $2`, 
				[placedItem.getPlacedItemId(), plotId]
			);

			if (existingItemResult.rows.length > 0) {
				return existingItemResult.rows[0];
			}

			const result = await client.query<PlacedItemEntity>(
				`INSERT INTO placed_items (id, owner, identifier, status) 
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (owner) 
				DO NOTHING
				RETURNING id, owner, identifier, status`,
				[placedItem.getPlacedItemId(), plotId, placedItem.itemData.id, placedItem.getStatus()]
			);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('There was an error creating the placedItem');
			}

			return result.rows[0];
		};

		return transactionWrapper(innerFunction, 'createPlacedItem', client);
	}

	/**
	 * If the placedItem does not exist, creates it for the user. Otherwise, modifies its identifier or status.
	 * @plotId the id of the plot the placedItem belongs to
	 * @item the placedItem
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new PlacedItemEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdatePlacedItem(plotId: string, item: PlacedItem, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			const existingPlacedItemResult = await client.query<{ id: string }>(
				'SELECT id FROM placed_items WHERE id = $1 OR owner = $2',
				[item.getPlacedItemId(), plotId]
			);

			let result;

			if (existingPlacedItemResult.rows.length > 0) {
				// Item already exists
				result = await this.replacePlacedItemById(existingPlacedItemResult.rows[0].id, item.itemData.id, item.getStatus(), client);
				if (!result) {
					throw new Error(`Error updating placedItem with id ${item.getPlacedItemId()}`);
				}
			} else {
				console.error(`creating placedItem for plot id ${plotId}`);
				result = await this.createPlacedItem(plotId, item, client);
				if (!result) {
					throw new Error(`Error creating placedItem with id ${item.getPlacedItemId()}`);
				}
			}

			return result;
		};

		return transactionWrapper(innerFunction, 'createOrUpdatePlacedItem', client);
	}

	/**
	 * Sets the identifier of the placedItem, effectively changing the item. Uses row level locking.
	 * @id the id of the placedItem
	 * @newIdentifier the item template id
	 * @newStatus the new status, defaults to empty string
	 * @returns a PlacedItemEntity with the new data on success (or throws error)
	 */
	async replacePlacedItemById(id: string, newIdentifier: string, newStatus?: string, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			if (!newStatus) {
				newStatus = '';
			}

			const placedItemResult = await client.query<PlacedItemEntity>(
				`WITH updated AS (
				   UPDATE placed_items 
				   SET identifier = $1, status = $2 
				   WHERE id = $3 
				   AND (identifier != $1 OR status IS DISTINCT FROM $2)
				 )
				 SELECT id, owner, identifier, status
				 FROM placed_items
				 WHERE id = $3;`,
				[newIdentifier, newStatus, id]
			);

			// Check if result is valid
			if (!placedItemResult) {
				throw new Error('There was an error updating the placedItem');
			}

			if (placedItemResult.rows.length === 0) {
				console.warn(`No changes made for placedItem with id ${id}`);
			}

			return placedItemResult.rows[0];
		};

		return transactionWrapper(innerFunction, 'replacePlacedItemById', client);
	}

	/**
	 * Sets the identifier of the placedItem, effectively changing the item. Uses row level locking.
	 * @plotId the id of the owner (plot)
	 * @newIdentifier the item template id
	 * @newStatus the new status, defaults to empty string
	 * @returns a PlacedItemEntity with the new data on success (or throws error)
	 */
	async replacePlacedItemByPlotId(plotId: string, newIdentifier: string, newStatus?: string, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			if (!newStatus) {
				newStatus = '';
			}

			const placedItemResult = await client.query<PlacedItemEntity>(
				'UPDATE placed_items SET identifier = $1, status = $2 WHERE owner = $3 RETURNING id, owner, identifier, status',
				[newIdentifier, newStatus, plotId]
			);

			// Check if result is valid
			if (!placedItemResult || placedItemResult.rows.length === 0) {
				throw new Error('There was an error updating the placedItem');
			}

			return placedItemResult.rows[0];
		};

		return transactionWrapper(innerFunction, 'replacePlacedItemByPlotId', client);
	}

	/**
	 * Sets the identifier of the placedItems, effectively changing the item. Uses row level locking.
	 * @plotIds the ids of the owner (plot)
	 * @newIdentifier the item template id
	 * @newStatus the new status, defaults to empty string
	 * @returns an object containing an array of successfully updated PlacedItemEntity and an array of errored plot IDs
	 */
	async replacePlacedItemsByPlotIds(plotIds: string[], newIdentifier: string, newStatus?: string, client?: PoolClient): Promise<{ updatedItems: PlacedItemEntity[], erroredPlotIds: string[] }> {
		const innerFunction = async (client: PoolClient): Promise<{ updatedItems: PlacedItemEntity[], erroredPlotIds: string[] }> => {
			if (!newStatus) {
				newStatus = '';
			}

			const updatedItems: PlacedItemEntity[] = [];
			const erroredPlotIds: string[] = [];

			// Perform the bulk update
			const placedItemResult = await client.query<PlacedItemEntity>(
				'UPDATE placed_items SET identifier = $1, status = $2 WHERE owner = ANY($3) RETURNING *',
				[newIdentifier, newStatus, plotIds]
			);

			// Collect updated plot IDs
			const updatedItemIds = placedItemResult.rows.map(item => item.owner);

			// Identify errored plot IDs (those that were not updated)
			for (const plotId of plotIds) {
				if (!updatedItemIds.includes(plotId)) {
					erroredPlotIds.push(plotId); // If the ID is not in the updated results, consider it errored
				} else {
					const updatedItem = placedItemResult.rows.find(item => item.owner === plotId);
					if (updatedItem) {
						updatedItems.push(updatedItem); // Add the successfully updated item
					}
				}
			}

			return { updatedItems, erroredPlotIds };
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'replacePlacedItemsByPlotIds', client);
	}


	/**
	 * Sets the status of the placedItem. Uses row level locking.
	 * @id the id of the placedItem
	 * @newStatus the new status
	 * @returns a PlacedItemEntity with the new data on success (or throws error)
	 */
	async setPlacedItemStatusById(id: string, newStatus: string, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			const placedItemResult = await client.query<PlacedItemEntity>(
				'UPDATE placed_items SET status = $1 WHERE id = $2 RETURNING id, owner, identifier, status',
				[newStatus, id]
			);

			// Check if result is valid
			if (!placedItemResult || placedItemResult.rows.length === 0) {
				throw new Error('There was an error updating the placedItem');
			}

			return placedItemResult.rows[0];
		};

		return transactionWrapper(innerFunction, 'setPlacedItemStatusById', client);
	}

	/**
	 * Sets the status of the placedItem. Uses row level locking.
	 * @plotId the id of the owner (plot)
	 * @newStatus the new status
	 * @returns a PlacedItemEntity with the new data on success (or throws error)
	 */
	async setPlacedItemStatusByPlotId(plotId: string, newStatus: string, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			const placedItemResult = await client.query<PlacedItemEntity>(
				'UPDATE placed_items SET status = $1 WHERE owner = $2 RETURNING id, owner, identifier, status',
				[newStatus, plotId]
			);

			// Check if result is valid
			if (!placedItemResult || placedItemResult.rows.length === 0) {
				throw new Error('There was an error updating the placedItem');
			}

			return placedItemResult.rows[0];
		};

		return transactionWrapper(innerFunction, 'setPlacedItemStatusByPlotId', client);
	}

	/**
	 * Deletes the specified placedItem from the database. Returns the deleted row.
	 * @id the id of the placedItem
	 * @returns a PlacedItemEntity with the new data on success (or throws error)
	 */
	async deletePlacedItemById(id: string, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			const deleteResult = await client.query<PlacedItemEntity>(
				'DELETE FROM placed_items WHERE id = $1 RETURNING id, owner, identifier, status',
				[id]
			);

			if (deleteResult.rows.length === 0) {
				throw new Error('No placedItem found to delete');
			}

			return deleteResult.rows[0];
		};

		return transactionWrapper(innerFunction, 'deletePlacedItemById', client);
	}


	/**
	 * Deletes the specified placedItem from the database. Returns the deleted row.
	 * @plotId the id of the owner (plot)
	 * @returns a PlacedItemEntity with the new data on success (or throws error)
	 */
	async deletePlacedItemByPlotId(plotId: string, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			const deleteResult = await client.query<PlacedItemEntity>(
				'DELETE FROM placed_items WHERE owner = $1 RETURNING id, owner, identifier, status',
				[plotId]
			);

			if (deleteResult.rows.length === 0) {
				throw new Error('No placedItem found to delete');
			}

			return deleteResult.rows[0];
		};

		return transactionWrapper(innerFunction, 'deletePlacedItemByPlotId', client);
	}

	/**
	 * Deletes the specified placedItem from the database. Returns the deleted row.
	 * @gardenId the id of the owner (garden)
	 * @rowIndex the row this plot is in
	 * @columnIndex the column this plot is in
	 * @returns a PlacedItemEntity with the new data on success (or throws error)
	 */
	async deletePlacedItemFromGarden(gardenId: string, rowIndex: number, columnIndex: number, client?: PoolClient): Promise<PlacedItemEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlacedItemEntity> => {
			const existingPlotResult = await client.query<{ plot_id: string }>(
				'SELECT id as plot_id FROM plots WHERE owner = $1 AND row_index = $2 and col_index = $3',
				[gardenId, rowIndex, columnIndex]
			);

			if (!existingPlotResult || existingPlotResult.rows.length === 0) {
				throw new Error(`Could not find plot for garden id: ${gardenId} at row ${rowIndex}, col ${columnIndex}`);
			}

			const deleteResult = await client.query<PlacedItemEntity>(
				'DELETE FROM placed_items WHERE owner = $1 RETURNING id, owner, identifier, status',
				[existingPlotResult.rows[0].plot_id]
			);

			if (deleteResult.rows.length === 0) {
				throw new Error('No placedItem found to delete');
			}

			return deleteResult.rows[0];
		};

		return transactionWrapper(innerFunction, 'deletePlacedItemFromGarden', client);
	}
}

const placedItemRepository = new PlacedItemRepository();
export default placedItemRepository;
