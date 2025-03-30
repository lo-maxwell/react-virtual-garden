import { pool, query } from "@/backend/connection/db";
import { Garden } from "@/models/garden/Garden";
import { Plot, PlotEntity } from "@/models/garden/Plot";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PoolClient } from "pg";
import placedItemRepository from "../../items/placedItem/placedItemRepository";
import { transactionWrapper } from "@/backend/services/utility/utility";
import assert from "assert";

class PlotRepository {
	/**
		 * Ensures that the object is of type PlotEntity, ie. that it contains an id, owner, row index, column index, plant time, uses remaining, and random seed field
		 */
	validatePlotEntity(plotEntity: any): boolean {
		if (!plotEntity || (typeof plotEntity.id !== 'string') || (typeof plotEntity.owner !== 'string') || (typeof plotEntity.row_index !== 'number') || (typeof plotEntity.col_index !== 'number') || (typeof plotEntity.plant_time !== 'string') || (typeof plotEntity.uses_remaining !== 'number')  || (typeof plotEntity.random_seed !== 'number')) {
			console.error(plotEntity);
			throw new Error(`Invalid types while creating Plot from PlotEntity`);
		}
		return true;
	}

	/** Get the placed item attached to the plot at this id, from the attached database. */
	async getPlacedItem(id: string): Promise<PlacedItem> {
		let itemEntity = await placedItemRepository.getPlacedItemByPlotId(id);
		let item: PlacedItem;
		if (!itemEntity) {
			item = generateNewPlaceholderPlacedItem('ground', '');
		} else {
			item = placedItemRepository.makePlacedItemObject(itemEntity);
		}
		return item;
	}

	/**
	 * Turns a plotEntity into a Plot object.
	 * @plotEntity - the plot entity
	 * @placedItem - the item in this plot
	 */
	makePlotObject(plotEntity: PlotEntity, placedItem: PlacedItem): Plot {
		assert(this.validatePlotEntity(plotEntity));

		const instance = new Plot(plotEntity.id, placedItem, plotEntity.plant_time, plotEntity.uses_remaining);
		instance.setRandomSeed(plotEntity.random_seed);
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
	async getPlotById(id: string): Promise<PlotEntity | null> {
		const result = await query<PlotEntity>('SELECT id, owner, row_index, col_index, plant_time, uses_remaining, random_seed FROM plots WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makePlotObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given an array of ids, returns the row data of plots matching an id from the database.
	 * @ids the ids of the plots in the database
	 */
	async getPlotsByIds(ids: string[]): Promise<PlotEntity[]> {
		if (ids.length === 0) {
			return []; // Return null if no IDs are provided
		}

		// Create a parameterized query with placeholders for each ID
		const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
		const queryText = `SELECT id, owner, row_index, col_index, plant_time, uses_remaining, random_seed FROM plots WHERE id IN (${placeholders})`;

		const result = await query<PlotEntity>(queryText, ids);
		
		// If no rows are returned, return an empty array instead of null
		return result.rows.length > 0 ? result.rows : [];
	}

	/**
	 * Given a garden id and coordinates, returns the row data of a plot from the database.
	 * @gardenId the id of the garden
	 * @rowIndex the row index, 0 indexed
	 * @colIndex the column index, 0 indexed
	 */
	async getPlotByGardenId(gardenId: string, rowIndex: number, columnIndex: number): Promise<PlotEntity | null> {
		const result = await query<PlotEntity>(
			'SELECT id, owner, row_index, col_index, plant_time, uses_remaining, random_seed FROM plots WHERE owner = $1 AND row_index = $2 AND col_index = $3',
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
	 * @returns an PlotEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createPlot(ownerId: string, rowIndex: number, columnIndex: number, plot?: Plot, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			if (!plot) {
				plot = Garden.generateEmptyPlot(rowIndex, columnIndex);
			}

			const result = await client.query<PlotEntity>(
				`INSERT INTO plots (id, owner, row_index, col_index, plant_time, uses_remaining) 
				VALUES ($1, $2, $3, $4, $5, $6) 
				ON CONFLICT (owner, row_index, col_index) 
				DO UPDATE SET
					plant_time = EXCLUDED.plant_time,
					uses_remaining = EXCLUDED.uses_remaining
				RETURNING id, owner, row_index, col_index, plant_time, uses_remaining, random_seed`,
				[plot.getPlotId(), ownerId, rowIndex, columnIndex, plot.getPlantTime(), plot.getUsesRemaining()]
			);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error(`There was an error creating the plot with owner ${ownerId}`);
			}

			return result.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createPlot', client);
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
	async createOrUpdatePlot(gardenId: string, rowIndex: number, columnIndex: number, plot: Plot, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			// Check if the plot already exists
			const existingPlotResult = await client.query<{ id: string }>(
				'SELECT id FROM plots WHERE id = $1 OR (owner = $2 AND row_index = $3 AND col_index = $4)',
				[plot.getPlotId(), gardenId, rowIndex, columnIndex]
			);

			let result: PlotEntity;

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

			return result;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createOrUpdatePlot', client);
	}

	/**
	 * Updates a plot (plant time, uses remaining)
	 * @plot the plot to update
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	 async updateEntirePlot(plot: Plot, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = $3 RETURNING *',
				[plot.getPlantTime(), plot.getUsesRemaining(), plot.getPlotId()]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			return plotResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updateEntirePlot', client);
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
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET row_index = $1, column_index = $2 WHERE id = $3 RETURNING *',
				[newRowIndex, newColumnIndex, id]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			return plotResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setPlotCoords', client);
	}

	/**
	 * Sets the plant time and usesRemaining of the plot. Uses row level locking.
	 * @id the id of the plot
	 * @newPlantTime the new plant time
	 * @newUsesRemaining the new uses remaining
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	 async setPlotDetails(id: string, newPlantTime: number, newUsesRemaining: number, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = $3 RETURNING *',
				[newPlantTime, newUsesRemaining, id]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			return plotResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setPlotDetails', client);
	}

	/**
	 * Sets the plant time and usesRemaining of all plots.
	 * @ids the ids of the plots
	 * @newPlantTime the new plant time
	 * @newUsesRemaining the new uses remaining
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async setMultiplePlotDetails(ids: string[], newPlantTime: number, newUsesRemaining: number, client?: PoolClient): Promise<{ updatedPlots: PlotEntity[], erroredPlots: string[] }> {
		const innerFunction = async (client: PoolClient): Promise<{ updatedPlots: PlotEntity[], erroredPlots: string[] }> => {
			const updatedPlots: PlotEntity[] = [];
			const erroredPlots: string[] = [];

			// Perform the bulk update
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = ANY($3) RETURNING *',
				[newPlantTime, newUsesRemaining, ids]
			);

			// Collect updated plot IDs
			const updatedPlotIds = plotResult.rows.map(plot => plot.id);

			// Identify errored plots (those that were not updated)
			for (const id of ids) {
				if (!updatedPlotIds.includes(id)) {
					erroredPlots.push(id); // If the ID is not in the updated results, consider it errored
				} else {
					const updatedPlot = plotResult.rows.find(plot => plot.id === id);
					if (updatedPlot) {
						updatedPlots.push(updatedPlot); // Add the successfully updated plot
					}
				}
			}

			return { updatedPlots, erroredPlots };
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setMultiplePlotDetails', client);
	}

	/**
	 * Sets the plant time of the plot. Uses row level locking.
	 * @id the id of the plot
	 * @newPlantTime the new plant time
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async setPlotPlantTime(id: string, newPlantTime: number, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET plant_time = $1 WHERE id = $2 RETURNING *',
				[newPlantTime, id]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			return plotResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setPlotPlantTime', client);
	}

	/**
	 * Sets the plant time of the plot. Uses row level locking.
	 * @id the id of the plot
	 * @newPlantTime the new plant time
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async setMultiplePlotPlantTime(ids: string[], newPlantTime: number, client?: PoolClient): Promise<PlotEntity[]> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity[]> => {
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET plant_time = $1 WHERE id = ANY($2) RETURNING *',
				[newPlantTime, ids]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plots');
			}

			return plotResult.rows; // Return all updated plots
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setMultiplePlotPlantTime', client);
	}


	/**
	 * Sets the uses remaining of the plot. Uses row level locking.
	 * @id the plot id
	 * @newUsesRemaining the new number of uses remaining
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async setPlotUsesRemaining(id: string, newUsesRemaining: number, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET uses_remaining = $1 WHERE id = $2 RETURNING *',
				[newUsesRemaining, id]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			return plotResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setPlotUsesRemaining', client);
	}


	/**
	 * Updates the uses remaining of the plot. Uses row level locking.
	 * @id the plot id
	 * @usesDelta the number of uses to change by (use -1 for decreasing by 1)
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	async updatePlotUsesRemaining(id: string, usesDelta: number, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			// Lock the row for update
			const lockResult = await client.query<{ id: string, uses_remaining: number }>(
				'SELECT id, uses_remaining FROM plots WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Plot not found for id: ${id}`);
			}

			const updatedUsesRemaining = lockResult.rows[0].uses_remaining + usesDelta;

			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET uses_remaining = $1 WHERE id = $2 RETURNING *',
				[updatedUsesRemaining, id]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot');
			}

			return plotResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updatePlotUsesRemaining', client);
	}

	/**
	 * Updates the uses remaining of the plot. Does not verify that the plot has enough uses remaining.
	 * @ids the plot ids
	 * @usesDelta the number of uses to change by (use -1 for decreasing by 1)
	 * @returns an array of PlotEntity with the new data on success (or throws error)
	 */
	async updateMultiplePlotUsesRemaining(ids: string[], usesDelta: number, client?: PoolClient): Promise<PlotEntity[]> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity[]> => {
			
			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET uses_remaining = uses_remaining + $1 WHERE id = ANY($2) RETURNING *',
				[usesDelta, ids]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plots');
			}

			return plotResult.rows; // Return all updated plots
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updateMultiplePlotUsesRemaining', client);
	}

	/**
	 * Updates the plot random seed, based on an internal formula.
	 * @id the id of the plot
	 * @iterations the number of times to update (usually 2 for harvesting plants)
	 * @returns a PlotEntity with the new data on success (or throws error)
	 */
	 async updatePlotSeed(id: string, iterations: number, client?: PoolClient): Promise<PlotEntity> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity> => {
			// Lock the row for update
			const lockResult = await client.query<{ id: string, random_seed: number }>(
				'SELECT id, random_seed FROM plots WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Plot not found for id: ${id}`);
			}

			let updatedSeed = lockResult.rows[0].random_seed;
			for (let i = 0; i < iterations; i++) {
				updatedSeed = Plot.getNextRandomSeed(updatedSeed);
			}

			const plotResult = await client.query<PlotEntity>(
				'UPDATE plots SET random_seed = $1 WHERE id = $2 RETURNING *',
				[updatedSeed, id]
			);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot random seed');
			}
			return plotResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updatePlotSeed', client);
	}

	/**
	 * Updates the plot random seed for multiple plots.
	 * @plotSeedMap map of plot id -> new random seed value
	 * @returns an array of PlotEntity with the new data on success (or throws error)
	 */
	async updateMultiplePlotSeed(plotSeedMap: Map<string, number>, client?: PoolClient): Promise<PlotEntity[]> {
		const innerFunction = async (client: PoolClient): Promise<PlotEntity[]> => {
			if (plotSeedMap.size === 0) {
				console.warn('No plots to update. plotSeedMap is empty.');
				return []; // Return an empty array or handle as needed
			}

			// Construct the SQL query
			const plotIds = Array.from(plotSeedMap.keys());
			const updatedSeeds = Array.from(plotSeedMap.values());

			// Ensure all updated seeds are integers
			updatedSeeds.forEach(seed => {
				if (typeof seed !== 'number') {
					throw new Error(`Invalid seed value: ${seed}. Expected a number.`);
				}
			});

			// Create the CASE statement for the update
			const caseStatements = plotIds.map((id, index) => `WHEN id = $${index + 1}::uuid THEN $${plotIds.length + index + 1}::integer`).join(' ');

			// Construct the full SQL query
			const sql = `
				UPDATE plots
				SET random_seed = CASE ${caseStatements} END
				WHERE id IN (${plotIds.map((_, index) => `$${index + 1}::uuid`).join(', ')})
				RETURNING *;
			`;

			// Prepare the parameters for the query
			const params = [...plotIds, ...updatedSeeds];

			// Execute the query
			const plotResult = await client.query<PlotEntity>(sql, params);

			// Check if result is valid
			if (!plotResult || plotResult.rows.length === 0) {
				throw new Error('There was an error updating the plot random seed');
			}

			return plotResult.rows;
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updateMultiplePlotSeed', client);
	}
}

const plotRepository = new PlotRepository();
export default plotRepository;
