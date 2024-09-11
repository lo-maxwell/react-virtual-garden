import { pool, query } from "@/backend/connection/db";
import LevelSystem, { LevelSystemEntity } from "@/models/level/LevelSystem";
import { PoolClient } from 'pg';

class LevelRepository {

	/**
	 * Turns a levelSystemEntity into a LevelSystem object.
	 */
	makeLevelSystemObject(levelEntity: LevelSystemEntity): LevelSystem {
		if (!levelEntity || (typeof levelEntity.level !== 'number') || (typeof levelEntity.current_xp !== 'number') || (typeof levelEntity.growth_rate !== 'number')) {
			console.error(levelEntity);
			throw new Error(`Invalid types while creating LevelSystem from LevelSystemEntity`);
		}
		return new LevelSystem(levelEntity.id, levelEntity.level, levelEntity.current_xp, levelEntity.growth_rate);
	}

	/**
	 * Returns a list of all levelsystems from the levels table.
	 * May throw errors if the query is misshapped.
	 * @returns LevelSystem[]
	 */
	async getAllLevelSystems(): Promise<LevelSystemEntity[]> {
		const result = await query<LevelSystemEntity>('SELECT * FROM levels', []);
		if (!result || result.rows.length === 0) return [];
		return result.rows;
		// const toReturn: LevelSystem[] = result.rows.map((row) => makeLevelSystemObject(row));
		// return toReturn;
	}

	/**
	 * Given its id, returns the row data of a level system from the database.
	 * @id the id of the levelsystem in the database
	 */
	async getLevelSystemById(id: string): Promise<LevelSystemEntity | null> {
		const result = await query<LevelSystemEntity>('SELECT * FROM levels WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance =  makeLevelSystemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given its id, returns the row data of a level system from the database.
	 * @ownerId the id of the owner (user) of the levelsystem in the database
	 * @ownerType string defining the owner, ie. 'user' (only users for now, but futureproofing for other possible objects with levels)
	 */
	async getLevelSystemByOwnerId(ownerId: string, ownerType: string): Promise<LevelSystemEntity | null> {
		const result = await query<LevelSystemEntity>('SELECT * FROM levels WHERE owner = $1 AND owner_type = $2', [ownerId, ownerType]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeLevelSystemObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Begins a transaction if there is not already one. Creates a new level row.
	 * On error, rolls back.
	 * @owner the id of the owner of this level system
	 * @ownerType the type, ie. user
	 * @levelSystem the level system to pull data from
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new LevelSystem with the corresponding data if success, null if failure (or throws error)
	 */
	async createLevelSystem(owner: string, ownerType: string, levelSystem: LevelSystem, client?: PoolClient): Promise<LevelSystemEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			// Check if the level already exists
			const existingLevelResult = await client.query<{id: string}>(
				'SELECT id FROM levels WHERE owner = $1',
				[owner]
			);

			if (existingLevelResult.rows.length > 0) {
				// Level System already exists
				const levelSystemEntity: LevelSystemEntity = levelSystem.toLevelSystemEntity();
				console.warn(`Level system already exists for user ${owner} with this ID: ${existingLevelResult.rows[0].id}`);
				return levelSystemEntity;
				// return makeLevelSystemObject(levelSystemEntity); 
			}
			
			const result = await query<LevelSystemEntity>(
				'INSERT INTO levels (id, owner, owner_type, level, current_xp, growth_rate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
				[levelSystem.getLevelSystemId(), owner, ownerType, levelSystem.getLevel(), levelSystem.getCurrentExp(), levelSystem.getGrowthRate()]
				);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('There was an error creating the level system');
			}


			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			return result.rows[0];
			// Return the created LevelSystem as an instance
			// const instance = makeLevelSystemObject(result.rows[0]);
			// return instance;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating level:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Sets the levelsystem data. Uses row level locking.
	 * @id the level system id
	 * @level the current level
	 * @currentExp the current xp
	 * @growthRate the growth rate, as a float
	 * @returns a LevelSystemEntity with the new data on success (or throws error)
	 */
	async setLevelSystem(id: string, level: number, currentExp: number, growthRate: number, client?: PoolClient): Promise<LevelSystemEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const lockResult = await client.query<LevelSystemEntity>(
				'SELECT * FROM levels WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error('Level system not found');
			}
		
			const levelSystemResult = await client.query<LevelSystemEntity>(
				'UPDATE levels SET level = $1, current_xp = $2, growth_rate = $3 WHERE id = $4 RETURNING level, current_xp, growth_rate',
				[level, currentExp, growthRate, id]
				);


			// Check if result is valid
			if (!levelSystemResult || levelSystemResult.rows.length === 0) {
				throw new Error('There was an error updating the level system');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = levelSystemResult.rows[0];
			return updatedRow;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error updating level system:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	/**
	 * Adds xp to the levelsystem. Uses row level locking.
	 * @id the id of the levelSystem
	 * @xpAmount the amount of xp gained, must be positive
	 * @returns a LevelSystemEntity with the new data on success (or throws error)
	 */
	async gainExp(id: string, xpAmount: number, client?: PoolClient): Promise<LevelSystemEntity | null> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			//Lock the row for update
			const lockResult = await client.query(
				'SELECT level, current_xp, growth_rate FROM levels WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Level system not found for id: ${id}`);
			}

			//Recreate level system from database
			const levelSystemCopy = this.makeLevelSystemObject(lockResult.rows[0]);
			//Calculate new data after adding xp
			levelSystemCopy.addExperience(xpAmount);
		
			const levelSystemResult = await client.query<LevelSystemEntity>(
				'UPDATE levels SET level = $1, current_xp = $2 WHERE id = $3 RETURNING level, current_xp, growth_rate',
				[levelSystemCopy.getLevel(), levelSystemCopy.getCurrentExp(), id]
				);


			// Check if result is valid
			if (!levelSystemResult || levelSystemResult.rows.length === 0) {
				throw new Error('There was an error updating the level system');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			const updatedRow = levelSystemResult.rows[0];
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

const levelRepository = new LevelRepository();
export default levelRepository;