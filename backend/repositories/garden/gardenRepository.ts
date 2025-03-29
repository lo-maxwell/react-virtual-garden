import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import { GardenEntity, Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import assert from "assert";
import { PoolClient } from "pg";
import plotRepository from "./plot/plotRepository";

class GardenRepository {

	/**
	 * Ensures that the object is of type GardenEntity, ie. that it contains an id, owner, owner name, row, and column field
	 */
	 validateGardenEntity(gardenEntity: any): boolean {
		if (!gardenEntity || (typeof gardenEntity.owner !== 'string') || (typeof gardenEntity.rows !== 'number') || (typeof gardenEntity.columns !== 'number')) {
			console.error(gardenEntity);
			throw new Error(`Invalid types while creating Garden from GardenEntity`);
		}
		return true;
	}

	/**
	 * Turns a gardenEntity into a Garden object.
	 */
	async makeGardenObject(extendedGardenEntity: GardenEntity): Promise<Garden> {
		assert(this.validateGardenEntity(extendedGardenEntity));

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
			
			const plotPromises: Promise<void>[] = []; // Array to garden promises

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
		const plots = await fetchOrGeneratePlotObjects(Garden.getMaximumRows(), Garden.getMaximumCols());
		const instance = new Garden(extendedGardenEntity.id, extendedGardenEntity.rows, extendedGardenEntity.columns, plots);

		return instance;
	}

	/**
	 * Returns a list of all gardens from the gardens table.
	 * May throw errors if the query is misshapped.
	 * @returns GardenEntity[]
	 */
	async getAllGardens(): Promise<GardenEntity[]> {
		const result = await query<GardenEntity>(
			'SELECT gardens.id, gardens.owner, gardens.rows, gardens.columns FROM gardens LEFT JOIN users ON users.id = gardens.owner',
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
	async getGardenById(id: string): Promise<GardenEntity | null> {
		const result = await query<GardenEntity>('SELECT gardens.id, gardens.owner, gardens.rows, gardens.columns FROM gardens LEFT JOIN users ON users.id = gardens.owner WHERE gardens.id = $1', [id]);
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
	async getGardenByOwnerId(userId: string): Promise<GardenEntity | null> {
		const result = await query<GardenEntity>('SELECT gardens.id, gardens.owner, gardens.rows, gardens.columns FROM gardens LEFT JOIN users ON users.id = gardens.owner WHERE gardens.owner = $1', [userId]);
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
	 * @returns an GardenEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createGarden(userId: string, garden: Garden, client?: PoolClient): Promise<GardenEntity> {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<GardenEntity> => {

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
				const extendedGardenEntity: GardenEntity = {
					id: existingGardenResult.rows[0].id,
					owner: userId,
					rows: garden.getRows(),
					columns: garden.getCols()
				}
				console.warn(`Garden already exists for user ${username} with this ID: ${existingGardenResult.rows[0].id}`);
				
				return extendedGardenEntity;
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

			const extendedResult = await query<GardenEntity>(
				`SELECT 
					gardens.id, 
					gardens.owner, 
					gardens.rows, 
					gardens.columns
				FROM gardens
				INNER JOIN users ON gardens.owner = users.id
				WHERE gardens.id = $1`,
				[newGardenId]
			);

			return extendedResult.rows[0];
		} 
		
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createGarden', client);
	}

	/**
	 * If the garden does not exist, creates it for the user. Otherwise, modifies its row/column size.
	 * @userId the id of the user the garden belongs to
	 * @garden the garden
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new GardenEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdateGarden(userId: string, garden: Garden, client?: PoolClient): Promise<GardenEntity> {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<GardenEntity> => {
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
			return result;
		}
		
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'createOrUpdateGarden', client);
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
	 async updateEntireGarden(garden: Garden, client?: PoolClient): Promise<GardenEntity> {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<GardenEntity> => {
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

			const extendedResult = await query<GardenEntity>(
				`SELECT 
					gardens.id, 
					gardens.owner, 
					gardens.rows, 
					gardens.columns
				FROM gardens
				INNER JOIN users ON gardens.owner = users.id
				WHERE gardens.id = $1`,
				[newGardenId]
			);

			return extendedResult.rows[0];
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updateEntireGarden', client);
	}


	/**
	 * Sets the size of the garden. Uses row level locking.
	 * @id the garden id
	 * @rowCount the new number of rows
	 * @columnCount the new number of columns
	 * @returns a GardenEntity with the new data on success (or throws error)
	 */
	async setGardenSize(id: string, rowCount: number, columnCount: number, client?: PoolClient): Promise<GardenEntity> {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<GardenEntity> => {
		
			const gardenResult = await client.query<GardenEntity>(
				'UPDATE gardens SET rows = $1, columns = $2 WHERE id = $3 RETURNING *',
				[rowCount, columnCount, id]
				);


			// Check if result is valid
			if (!gardenResult || gardenResult.rows.length === 0) {
				throw new Error('There was an error updating the garden');
			}

			const updatedRow = gardenResult.rows[0];
			return updatedRow;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'setGardenSize', client);
		
	}

	/**
	 * Modifies the dimensions of the garden. Does not verify that the new dimensions are valid, besides being nonnegative. Uses row level locking.
	 * @id the garden id
	 * @rowDelta the number of rows to change by
	 * @columnDelta the number of columns to change by
	 * @returns a GardenEntity with the new data on success (or throws error)
	 */
	async updateGardenSize(id: string, rowDelta: number, columnDelta: number, client?: PoolClient): Promise<GardenEntity> {
		// Define the inner function that handles the core logic inside the transaction
		const innerFunction = async (client: PoolClient): Promise<GardenEntity> => {
		
			const gardenResult = await client.query<GardenEntity>(
				'UPDATE gardens SET rows = rows + $1, columns = columns + $2 WHERE id = $3 RETURNING *',
				[rowDelta, columnDelta, id]
				);

			// Check if result is valid
			if (!gardenResult || gardenResult.rows.length === 0) {
				console.error(gardenResult);
				throw new Error('There was an error updating the garden size');
			}

			const updatedRow = gardenResult.rows[0];
			return updatedRow;
		}

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'updateGardenSize', client);
	}

}

const gardenRepository = new GardenRepository();
export default gardenRepository;