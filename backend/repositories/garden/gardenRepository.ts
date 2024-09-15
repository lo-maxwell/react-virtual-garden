import { pool, query } from "@/backend/connection/db";
import { GardenEntity, Garden, ExtendedGardenEntity, GardenDimensionEntity } from "@/models/garden/Garden";
import { ExtendedPlotEntity, Plot } from "@/models/garden/Plot";
import { PoolClient } from "pg";
import plotRepository from "./plot/plotRepository";

class GardenRepository {
	/**
	 * Turns a gardenEntity into a Garden object.
	 */
	async makeGardenObject(extendedGardenEntity: ExtendedGardenEntity): Promise<Garden> {
		if (!extendedGardenEntity || (typeof extendedGardenEntity.owner_name !== 'string') || (typeof extendedGardenEntity.owner !== 'string') || (typeof extendedGardenEntity.rows !== 'number') || (typeof extendedGardenEntity.columns !== 'number')) {
			console.error(extendedGardenEntity);
			throw new Error(`Invalid types while creating Garden from GardenEntity`);
		}

		async function fetchOrGeneratePlotObjects(rows: number, cols: number): Promise<Plot[][]> {
			//TODO: Implement this
			const plots: Plot[][] = [];

			function initializePlots(rows: number, cols: number): void {
				for (let i = 0; i < rows; i++) {
				// Create an array of nulls for each row
				const row: (Plot)[] = new Array(cols).fill(null);
				plots.push(row);
				}
			}
			initializePlots(rows, cols);
			
			const plotPromises: Promise<void>[] = []; // Array to store promises

			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					const plotPromise = plotRepository.getPlotByGardenId(extendedGardenEntity.id, i, j)
						.then(async (plotEntityResult) => {
							if (!plotEntityResult) {
								console.warn(`Could not find existing plot for garden id ${extendedGardenEntity.id}, row ${i}, col ${j}`);
								console.warn(`Making new plot on backend model only (database is not changed)`);
								const plotInstance = Garden.generateEmptyPlot(i, j);
								plots[i][j] = plotInstance;
								return;
							}
							// Await `makePlotObject` to ensure it's properly awaited
							const plotResult = await plotRepository.makePlotObject(plotEntityResult);
							plots[i][j] = plotResult;
					})
					plotPromises.push(plotPromise);
				}
			}

			// Wait for all plot creation promises to resolve
			await Promise.allSettled(plotPromises);
			return plots;
		}

		// const plots: Plot[][] = [];
		const plots = await fetchOrGeneratePlotObjects(extendedGardenEntity.rows, extendedGardenEntity.columns);
		const instance = new Garden(extendedGardenEntity.id, extendedGardenEntity.owner_name, extendedGardenEntity.rows, extendedGardenEntity.columns, plots);

		return instance;
	}

	/**
	 * Returns a list of all gardens from the gardens table.
	 * May throw errors if the query is misshapped.
	 * @returns ExtendedGardenEntity[]
	 */
	async getAllGardens(): Promise<ExtendedGardenEntity[]> {
		const result = await query<ExtendedGardenEntity>(
			'SELECT users.username AS owner_name, gardens.id, gardens.owner, gardens.rows, gardens.columns FROM gardens LEFT JOIN users ON users.id = gardens.owner',
			[]);
		if (!result || result.rows.length === 0) return [];
		return result.rows;
		// const toReturn: Garden[] = result.rows.map((row) => makeGardenObject(row));
		// return toReturn;
	}

	/**
	 * Given its id, returns the row data of a garden from the database.
	 * @id the id of the garden in the database
	 */
	async getGardenById(id: string): Promise<ExtendedGardenEntity | null> {
		const result = await query<ExtendedGardenEntity>('SELECT users.username AS owner_name, gardens.id, gardens.owner, gardens.rows, gardens.columns FROM gardens LEFT JOIN users ON users.id = gardens.owner WHERE gardens.id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance =  makeGardenObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given a user id, returns the row data of a garden from the database.
	 * @userId the id of the user
	 */
	async getGardenByOwnerId(userId: string): Promise<ExtendedGardenEntity | null> {
		const result = await query<ExtendedGardenEntity>('SELECT users.username AS owner_name, gardens.id, gardens.owner, gardens.rows, gardens.columns FROM gardens LEFT JOIN users ON users.id = gardens.owner WHERE gardens.owner = $1', [userId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeGardenObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Begins a transaction if there is not already one. Creates a new garden row and plot rows.
	 * On error, rolls back.
	 * @userId the id of the owner (user) of this garden. If the owner cannot be found, fails.
	 * @garden the garden to pull data from
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns an ExtendedGardenEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createGarden(userId: string, garden: Garden, client?: PoolClient): Promise<ExtendedGardenEntity> {
		//TODO: Call createPlots here
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			// Check if the garden already exists
			const existingGardenResult = await client.query<{id: string}>(
				'SELECT id FROM gardens WHERE id = $1',
				[garden.getGardenId()]
			);

			const usernameResult = await client.query<{username: string}>(
				'SELECT username FROM users WHERE id = $1',
				[userId]
			);

			if (!usernameResult || usernameResult.rows.length === 0) {
				throw new Error(`There was an error creating the garden: could not find user for id ${userId}`);
			}
			
			const username = usernameResult.rows[0].username;

			if (existingGardenResult.rows.length > 0) {
				// Garden already exists
				const extendedGardenEntity: ExtendedGardenEntity = {
					owner_name: username,
					id: existingGardenResult.rows[0].id,
					owner: userId,
					rows: garden.getRows(),
					columns: garden.getCols()
				}
				console.warn(`Garden already exists for user ${username} with this ID: ${existingGardenResult.rows[0].id}`);
				if (shouldReleaseClient) {
					await client.query('ROLLBACK'); // Rollback the transaction on error
				}
				return extendedGardenEntity;
				// return makeGardenObject(extendedGardenEntity); 
			}

			
			const result = await query<{id: string}>(
				'INSERT INTO gardens (id, owner, rows, columns) VALUES ($1, $2, $3, $4) RETURNING id',
				[garden.getGardenId(), userId, garden.getRows(), garden.getCols()]
				);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('There was an error creating the garden');
			}

			const newGardenId = result.rows[0].id;

			const extendedResult = await query<ExtendedGardenEntity>(
				`SELECT 
					gardens.id, 
					gardens.owner, 
					gardens.rows, 
					gardens.columns, 
					users.username AS owner_name
				FROM gardens
				INNER JOIN users ON gardens.owner = users.id
				WHERE gardens.id = $1`,
				[newGardenId]
			);

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			return extendedResult.rows[0];
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating garden:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * If the garden does not exist, creates it for the user. Otherwise, modifies its row/column size.
	 * @userId the id of the user the garden belongs to
	 * @garden the garden
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new GardenEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdateGarden(userId: string, garden: Garden, client?: PoolClient): Promise<ExtendedGardenEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			// Check if the garden already exists
			const existingGardenResult = await client.query<{id: string}>(
				'SELECT id FROM gardens WHERE id = $1',
				[garden.getGardenId()]
			);

			let result;

			if (existingGardenResult.rows.length > 0) {
				// Garden already exists
				result = await this.updateEntireGarden(garden, client);
				if (!result) {
					throw new Error(`Error updating garden with id ${garden.getGardenId()}`);
				} 
			} else {
				result = await this.createGarden(userId, garden, client);
				if (!result) {
					throw new Error(`Error creating garden with id ${garden.getGardenId()}`);
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
	 * Begins a transaction if there is not already one. 
	 * Updates the garden in the database.
	 * Cannot modify the owner, only row/column size
	 * On error, rolls back.
	 * @userId the id of the owner (user) of this garden. If the owner cannot be found, fails.
	 * @garden the garden to pull data from
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a GardenEntity with the corresponding data if success, null if failure (or throws error)
	 */
	 async updateEntireGarden(garden: Garden, client?: PoolClient): Promise<ExtendedGardenEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			// Check if the garden already exists
			const existingGardenResult = await client.query<{id: string}>(
				'SELECT id FROM gardens WHERE id = $1',
				[garden.getGardenId()]
			);

			if (existingGardenResult.rows.length === 0) {
				//Garden does not exist
				throw new Error(`Could not find garden for id ${garden.getGardenId()}`);
			}
			
			const result = await query<GardenEntity>(
				'UPDATE gardens SET rows = $1, columns = $2 WHERE id = $3 RETURNING id, owner, rows, columns',
				[garden.getRows(), garden.getCols(), garden.getGardenId()]
				);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('There was an error updating the garden');
			}

			const newGardenId = result.rows[0].id;

			const extendedResult = await query<ExtendedGardenEntity>(
				`SELECT 
					gardens.id, 
					gardens.owner, 
					gardens.rows, 
					gardens.columns, 
					users.username AS owner_name
				FROM gardens
				INNER JOIN users ON gardens.owner = users.id
				WHERE gardens.id = $1`,
				[newGardenId]
			);

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			return extendedResult.rows[0];
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating garden:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Sets the size of the garden. Uses row level locking.
	 * @id the garden id
	 * @rowCount the new number of rows
	 * @columnCount the new number of columns
	 * @returns a GardenEntity with the new data on success (or throws error)
	 */
	async setGardenSize(id: string, rowCount: number, columnCount: number, client?: PoolClient): Promise<GardenEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
		
			const gardenResult = await client.query<GardenEntity>(
				'UPDATE gardens SET rows = $1, columns = $2 WHERE id = $3 RETURNING *',
				[rowCount, columnCount, id]
				);


			// Check if result is valid
			if (!gardenResult || gardenResult.rows.length === 0) {
				throw new Error('There was an error updating the garden');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = gardenResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating garden:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	/**
	 * Modifies the dimensions of the garden. Does not verify that the new dimensions are valid, besides being nonnegative. Uses row level locking.
	 * @id the garden id
	 * @rowDelta the number of rows to change by
	 * @columnDelta the number of columns to change by
	 * @returns a GardenEntity with the new data on success (or throws error)
	 */
	async updateGardenSize(id: string, rowDelta: number, columnDelta: number, client?: PoolClient): Promise<GardenEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const lockResult = await client.query<GardenEntity>(
				'SELECT * FROM gardens WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (!lockResult || lockResult.rows.length === 0) {
				throw new Error(`Garden not found for id: ${id}`);
			}

			const currentGardenEntity = lockResult.rows[0];
		
			const gardenResult = await client.query<GardenEntity>(
				'UPDATE gardens SET rows = $1, columns = $2 WHERE id = $3 RETURNING *',
				[currentGardenEntity.rows + rowDelta, currentGardenEntity.columns + columnDelta, currentGardenEntity.owner]
				);


			// Check if result is valid
			if (!gardenResult || gardenResult.rows.length === 0) {
				throw new Error('There was an error updating the garden');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = gardenResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error gaining xp:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

}

const gardenRepository = new GardenRepository();
export default gardenRepository;