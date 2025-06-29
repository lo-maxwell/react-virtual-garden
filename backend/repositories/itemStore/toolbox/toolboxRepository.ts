import { pool, query } from "@/backend/connection/db";
import Toolbox, { ToolboxEntity } from "@/models/itemStore/toolbox/tool/Toolbox";
import { ToolList } from "@/models/itemStore/toolbox/toolList";
import assert from "assert";
import { PoolClient } from "pg";
import toolRepository from "../../items/tool/toolRepository";

class ToolboxRepository {

	async getTools(id: string): Promise<ToolList> {
		const itemResults = await toolRepository.getAllToolsByOwnerId(id);
		const items = new ToolList();
		for (const itemResult of itemResults) {
			try {
				const item = toolRepository.makeToolObject(itemResult);
				items.addTool(item);
			} catch (error) {
				console.error(`Failure while initializing items for toolbox from database: `);
				console.error(error);
			}
		}
		return items;
	}

	validateToolboxEntity(toolboxEntity: any): boolean {
		if (!toolboxEntity || (typeof toolboxEntity.id !== 'string')|| (typeof toolboxEntity.owner !== 'string')) {
			console.error(toolboxEntity);
			throw new Error(`Invalid types while creating Toolbox`);
		}
		return true;
	}

	/**
	 * Turns a toolboxEntity into a Toolbox object.
	 */
	 async makeToolboxObject(toolboxEntity: ToolboxEntity, itemList: ToolList | null): Promise<Toolbox> {
		assert(this.validateToolboxEntity(toolboxEntity), 'ToolboxEntity validation failed');
		//TODO: Fetches all relevant data from database and uses it to construct user
		// let itemList: ItemList = await this.getTools(toolboxEntity.id);
		if (!itemList) itemList = new ToolList();
		return new Toolbox(toolboxEntity.id, itemList);
	}

	/**
	 * Returns a list of all Toolboxes from the toolboxes table.
	 * May throw errors if the query is misshapped.
	 * @returns Toolbox[]
	 */
	async getAllToolboxes(): Promise<ToolboxEntity[]> {
		const result = await query<ToolboxEntity>('SELECT id FROM toolboxes', []);
		if (!result || result.rows.length === 0) return [];
		return result.rows;
	}

	/**
	 * Given its id, returns the row data of an toolbox from the database.
	 * @id the id of the toolbox in the database
	 */
	async getToolboxById(id: string): Promise<ToolboxEntity | null> {
		const result = await query<ToolboxEntity>('SELECT * FROM toolboxes WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const toolboxRecord = result.rows[0];
		return toolboxRecord;
	}

	/**
	 * Given a user id, returns the row data of an toolbox from the database.
	 * @userId the user id
	 */
	async getToolboxByOwnerId(userId: string): Promise<ToolboxEntity | null> {
		const result = await query<ToolboxEntity>('SELECT * FROM toolboxes WHERE owner = $1', [userId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const toolboxRecord = result.rows[0];
		return toolboxRecord;
	}


	/**
	 * Begins a transaction if there is not already one. Creates a new toolbox row.
	 * On error, rolls back.
	 * @userId the user id of the owner of this toolbox
	 * @toolbox the toolbox to pull data from
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new Toolbox with the corresponding data if success, null if failure (or throws error)
	 */
	async createToolbox(userId: string, toolbox: Toolbox, client?: PoolClient): Promise<ToolboxEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}
			// Check if the toolbox already exists
			const existingToolboxResult = await client.query<ToolboxEntity>(
				'SELECT id, owner FROM toolboxes WHERE owner = $1',
				[userId]
			);

			if (existingToolboxResult.rows.length > 0) {
				// Toolbox already exists
				console.warn(`Toolbox already exists for user ${userId} with this ID: ${existingToolboxResult.rows[0].id}`);
				return existingToolboxResult.rows[0];
			}
		
			const result = await query<ToolboxEntity>(
				'INSERT INTO toolboxes (id, owner) VALUES ($1, $2) RETURNING *',
				[toolbox.getToolboxId(), userId]
				);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('Failed to insert toolbox');
			}

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			// Return the created Toolbox as an instance
			const toolboxRecord = result.rows[0];
			return toolboxRecord;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating toolbox:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}


	
	/**
	 * If the toolbox does not exist, creates it for the user. Obselete, as there is currently no point in updating a toolbox. Redirects to createToolbox.
	 * @userId the id of the user the toolbox belongs to
	 * @toolbox the toolbox
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new ToolboxEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdateToolbox(userId: string, toolbox: Toolbox, client?: PoolClient): Promise<ToolboxEntity> {
		return this.createToolbox(userId, toolbox, client);

		// const shouldReleaseClient = !client;
		// if (!client) {
		// 	client = await pool.connect();
		// }
		// try {
		// 	if (shouldReleaseClient) {
		// 		await client.query('BEGIN'); // Start the transaction
		// 	}
		// 	// Check if the toolbox already exists
		// 	const existingToolboxResult = await client.query<{id: string}>(
		// 		'SELECT id FROM toolboxes WHERE id = $1',
		// 		[toolbox.getToolboxId()]
		// 	);

		// 	let result;

		// 	if (existingToolboxResult.rows.length > 0) {
		// 		// Toolbox already exists
		// 		result = await this.setToolboxGold(toolbox.getToolboxId(), toolbox.getGold(), client);
		// 		if (!result) {
		// 			throw new Error(`Error updating toolbox with id ${toolbox.getToolboxId()}`);
		// 		} 
		// 	} else {
		// 		result = await this.createToolbox(userId, toolbox, client);
		// 		if (!result) {
		// 			throw new Error(`Error creating toolbox with id ${toolbox.getToolboxId()}`);
		// 		} 
		// 	}

		// 	if (shouldReleaseClient) {
		// 		await client.query('COMMIT'); // Rollback the transaction on error
		// 	}

		// 	return result;
		// } catch (error) {
		// 	if (shouldReleaseClient) {
		// 		await client.query('ROLLBACK'); // Rollback the transaction on error
		// 	}
		// 	console.error('Error creating toolbox:', error);
		// 	throw error; // Rethrow the error for higher-level handling
		// } finally {
		// 	if (shouldReleaseClient) {
		// 		client.release(); // Release the client back to the pool
		// 	}
		// }
	}


}

const toolboxRepository = new ToolboxRepository();
export default toolboxRepository;