import { pool, query } from "@/backend/connection/db";
import { Garden } from "@/models/garden/Garden";
import { ExtendedPlotEntity, Plot, PlotEntity } from "@/models/garden/Plot";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PoolClient } from "pg";
import placedItemRepository from "../../items/placedItem/placedItemRepository";

class PlotRepository {

	/**
	 * Turns a plotEntity into a Plot object.
	 * @extendedPlotEntity - the plot entity
	 */
	async makePlotObject(extendedPlotEntity: ExtendedPlotEntity): Promise<Plot> {
		if (!extendedPlotEntity || (typeof extendedPlotEntity.id !== 'string') || (typeof extendedPlotEntity.plant_time !== 'string') || (typeof extendedPlotEntity.uses_remaining !== 'number')) {
			console.error(extendedPlotEntity);
			throw new Error(`Invalid types while creating Plot from PlotEntity`);
		}

		let itemEntity = await placedItemRepository.getPlacedItemByPlotId(extendedPlotEntity.id);
		let item: PlacedItem;
		if (!itemEntity) {
			item = generateNewPlaceholderPlacedItem('ground', '');
		} else {
			item = placedItemRepository.makePlacedItemObject(itemEntity);
		}

		const instance = new Plot(extendedPlotEntity.id, item, extendedPlotEntity.plant_time, extendedPlotEntity.uses_remaining);
		
		return instance;
	}

	/**
	 * Throws an error. Do not use!
	 * May throw errors if the query is misshapped.
	 * @returns Plot[]
	 */
	async getAllPlots(): Promise<Plot[]> {
		throw new Error('Not implemented yet!');
	}

	/**
	 * Given its id, returns the row data of a plot from the database.
	 * @id the id of the plot in the database
	 */
	async getPlotById(id: string): Promise<ExtendedPlotEntity | null> {
		const result = await query<ExtendedPlotEntity>('SELECT id, row_index, plant_time, uses_remaining FROM plots WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makePlotObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given a garden id and coordinates, returns the row data of a plot from the database.
	 * @gardenId the id of the garden
	 * @rowIndex the row index, 0 indexed
	 * @colIndex the column index, 0 indexed
	 */
	async getPlotByGardenId(gardenId: string, rowIndex: number, columnIndex: number): Promise<ExtendedPlotEntity | null> {
		const result = await query<ExtendedPlotEntity>(
			'SELECT id, row_index, plant_time, uses_remaining FROM plots WHERE owner = $1 AND row_index = $2 AND col_index = $3',
			[gardenId, rowIndex, columnIndex]
			);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makePlotObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Begins a transaction if there is not already one. Creates a new plot row.
	 * On error, rolls back.
	 * @ownerId the id of the owner of this plot. If the owner cannot be found, fails.
	 * @rowIndex the row index
	 * @columnIndex the column index
	 * @plot the plot used to create this object, defaults to ground
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns an ExtendedPlotEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createPlot(ownerId: string, rowIndex: number, columnIndex: number, plot?: Plot, client?: PoolClient): Promise<ExtendedPlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		if (!plot) {
			plot = Garden.generateEmptyPlot(rowIndex, columnIndex);
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			const result = await client.query<ExtendedPlotEntity>(
				`INSERT INTO plots (id, owner, row_index, col_index, plant_time, uses_remaining) 
				VALUES ($1, $2, $3, $4, $5, $6) 
				ON CONFLICT (owner, row_index, col_index) 
				DO UPDATE SET
					plant_time = EXCLUDED.plant_time,
					uses_remaining = EXCLUDED.uses_remaining
				RETURNING id, owner, row_index, col_index, plant_time, uses_remaining`,
				[plot.getPlotId(), ownerId, rowIndex, columnIndex, plot.getPlantTime(), plot.getUsesRemaining()]
			);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error(`There was an error creating the plot with id ${result.rows[0].id}`);
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			return result.rows[0];
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * If the plot does not exist, creates it for the garden. Otherwise, modifies its plant time and uses remaining.
	 * @gardenId the id of the garden the plot belongs to
	 * @rowIndex the row index
	 * @columnIndex the column index
	 * @plot the plot
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new GardenEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdatePlot(gardenId: string, rowIndex: number, columnIndex: number, plot: Plot, client?: PoolClient): Promise<ExtendedPlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			//TODO: Delete plots if they are found here
			// Check if the plot already exists

			const existingPlotResult = await client.query<{id: string}>(
				'SELECT id FROM plots WHERE id = $1 OR (owner = $2 AND row_index = $3 AND col_index = $4)',
				[plot.getPlotId(), gardenId, rowIndex, columnIndex]
			);

			let result;

			if (existingPlotResult.rows.length > 0) {
				// Plot already exists
				result = await this.updateEntirePlot(plot, client);
				if (!result) {
					throw new Error(`Error updating plot with id ${plot.getPlotId()}`);
				} 
			} else {
				result = await this.createPlot(gardenId, rowIndex, columnIndex, plot, client);
				if (!result) {
					throw new Error(`Error creating plot with id ${plot.getPlotId()}`);
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
			console.error('Error creating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * Updates a plot (plant time, uses remaining)
	 * @plot the plot to update
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	 async updateEntirePlot(plot: Plot, client?: PoolClient): Promise<ExtendedPlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
		
			const plotResult = await client.query<ExtendedPlotEntity>(
				'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = $3 RETURNING *',
				[plot.getPlantTime(), plot.getUsesRemaining(), plot.getPlotId()]
				);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = plotResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Sets the coordinates of the plot. Uses row level locking.
	 * This is a dangerous operation that probably shouldn't be used often, make sure to update the backend at the same time
	 * @id the id of the plot
	 * @newRowIndex the new row index
	 * @newColumnIndex the new column index
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async setPlotCoords(id: string, newRowIndex: number, newColumnIndex: number, client?: PoolClient): Promise<PlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
		
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET row_index = $1, column_index = $2 WHERE id = $3 RETURNING *',
				[newRowIndex, newColumnIndex, id]
				);


			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = plotResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * Sets the plant time and usesRemaining of the plot. Uses row level locking.
	 * @id the id of the plot
	 * @newPlantTime the new plant time
	 * @newUsesRemaining the new uses remaining
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	 async setPlotDetails(id: string, newPlantTime: number, newUsesRemaining: number, client?: PoolClient): Promise<PlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
		
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = $3 RETURNING *',
				[newPlantTime, newUsesRemaining, id]
				);


			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = plotResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * Sets the plant time of the plot. Uses row level locking.
	 * @id the id of the plot
	 * @newPlantTime the new plant time
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async setPlotPlantTime(id: string, newPlantTime: number, client?: PoolClient): Promise<PlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
		
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET plant_time = $1 WHERE id = $2 RETURNING *',
				[newPlantTime, id]
				);


			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = plotResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Sets the uses remaining of the plot. Uses row level locking.
	 * @id the plot id
	 * @newUsesRemaining the new number of uses remaining
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async setPlotUsesRemaining(id: string, newUsesRemaining: number, client?: PoolClient): Promise<PlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
		
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET uses_remaining = $1 WHERE id = $2 RETURNING *',
				[newUsesRemaining, id]
				);


			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = plotResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Updates the uses remaining of the plot. Uses row level locking.
	 * @id the plot id
	 * @usesDelta the number of uses to change by (use -1 for decreasing by 1)
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async updatePlotUsesRemaining(id: string, usesDelta: number, client?: PoolClient): Promise<PlotEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const lockResult = await client.query<{id: string, uses_remaining: number}>(
				'SELECT id, uses_remaining FROM plots WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Plot not found for id: ${id}`);
			}
		
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET uses_remaining = $1 WHERE id = $2 RETURNING *',
				[lockResult.rows[0].uses_remaining + usesDelta, id]
				);


			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = plotResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating plot:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}
}

const plotRepository = new PlotRepository();
export default plotRepository;