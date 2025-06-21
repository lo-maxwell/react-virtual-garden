import { transactionWrapper } from "@/backend/services/utility/utility";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { ShovelTemplate } from "@/models/items/templates/models/ToolTemplates/ShovelTemplate";
import Shovel from "@/models/items/tools/Shovel";
import { Tool, ToolEntity } from "@/models/items/tools/Tool";
import { getItemClassFromSubtype } from "@/models/items/utility/itemClassMaps";
import { getToolClassFromType } from "@/models/items/utility/toolClassMaps";
import { ToolList } from "@/models/itemStore/toolbox/toolList";
import assert from "assert";
import { PoolClient } from "pg";
import { pool, query } from "@/backend/connection/db";

/** We should only be creating or deleting tools, they are 1 off and have no internal data
 * TODO: Consider making tools have a owned/active field so we can update 1 field instead of add/delete, but low priority, can't even remove tools right now
 */
class ToolRepository {

	/**
	 * Ensures that the object is of type ToolEntity, ie. that it contains an id, owner, identifier, and quantity field
	 */
	validateToolEntity(toolEntity: any): boolean {
		if (!toolEntity || (typeof toolEntity.id !== 'string') || (typeof toolEntity.owner !== 'string') || (typeof toolEntity.identifier !== 'string')) {
			console.error(toolEntity);
			throw new Error(`Invalid types while creating Tool from ToolEntity`);
		}
		return true;
	}

	makeToolObjectBatch(toolEntities: ToolEntity[]): ToolList {
		const items = new ToolList();
		for (const itemResult of toolEntities) {
			try {
				const item = this.makeToolObject(itemResult);
				items.addTool(item);
			} catch (error) {
				console.error(`Failure while initializing items for inventory from database: `);
				console.error(error);
			}
		}
		return items;
	}

	makeToolObject(toolEntity: ToolEntity): Tool {
		assert(this.validateToolEntity(toolEntity), 'ToolEntity validation failed');

		const itemData = itemTemplateFactory.getToolTemplateById(toolEntity.identifier);
		if (!itemData) {
			console.warn(`Could not find tool matching id ${toolEntity.identifier}`)
			return new Shovel(toolEntity.id, ShovelTemplate.getErrorTemplate());
		}
		const itemClass = getToolClassFromType(itemData);

		const instance = new itemClass(toolEntity.id, itemData);
		if (!(instance instanceof Tool)) {
			console.warn(`Attempted to create non Tool for id ${toolEntity.identifier}`);
			return new Shovel(toolEntity.id, ShovelTemplate.getErrorTemplate());
		}
		return instance;
	}

	/**
	 * Throws an error. Do not use!
	 * May throw errors if the query is misshapped.
	 * @returns Tool[]
	 */
	async getAllTools(): Promise<ToolEntity[]> {
		throw new Error('Not implemented yet!');
	}

	/**
	 * Given its id, returns the row data of an tool from the database.
	 * @id the id of the tool in the database
	 */
	async getToolById(id: string): Promise<ToolEntity | null> {
		const result = await query<ToolEntity>('SELECT id, owner, identifier FROM tools WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeToolObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given a toolbox id, returns all tools owned by that toolbox from the database.
	 * @toolboxId the id of the toolbox in the database
	 */
	async getAllToolsByOwnerId(toolboxId: string): Promise<ToolEntity[]> {
		const result = await query<ToolEntity>(
			'SELECT id, owner, identifier FROM tools WHERE owner = $1',
			[toolboxId]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		return result.rows;
		// const instance = makeToolObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Given a toolbox id, returns the row data of an tool from the database.
	 * @toolboxId the id of the toolbox in the database
	 * @identifier the item template id
	 */
	async getToolByOwnerId(toolboxId: string, identifier: string): Promise<ToolEntity | null> {
		const result = await query<ToolEntity>('SELECT id, owner, identifier FROM tools WHERE owner = $1 AND identifier = $2', [toolboxId, identifier]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
		// const instance = makeToolObject(result.rows[0]);
		// return instance;
	}

	/**
	 * Begins a transaction if there is not already one. Creates a new tool row.
	 * On error, rolls back.
	 * @ownerId the id of the owner of this tool. If the owner cannot be found, fails.
	 * @tool the tool used to create this object
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns an ToolEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async createTool(ownerId: string, tool: Tool, client?: PoolClient): Promise<ToolEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<ToolEntity> => {

			const existingItemResult = await client.query<ToolEntity>(
				`SELECT id, owner, identifier FROM tools 
				WHERE id = $1 OR (owner = $2 AND identifier = $3)`, 
				[tool.getToolId(), ownerId, tool.itemData.id]
			);

			if (existingItemResult.rows.length > 0) {
				return existingItemResult.rows[0];
			}

			const result = await client.query<ToolEntity>(
				`INSERT INTO tools (id, owner, identifier) 
				VALUES ($1, $2, $3)
				ON CONFLICT (id) 
				DO NOTHING
				RETURNING id, owner, identifier`,
				[tool.getToolId(), ownerId, tool.itemData.id]
			);

			// Check if result is valid
			if (!result || result.rows.length === 0) {
				throw new Error('There was an error creating the tool');
			}

			return result.rows[0];
		} 

		return transactionWrapper(innerFunction, "createTool", client);
	}


	/**
	 * Adds an item to the database. If the item already exists, does nothing. Otherwise, creates a new item row. Begins a transaction if there is not already one. 
	 * On error, rolls back.
	 * @ownerId the id of the owner of this tool. If the owner cannot be found, fails.
	 * @tool the tool used to create this object
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a ToolEntity with the corresponding data if success, null if failure (or throws error)
	 */
	async addTool(ownerId: string, tool: Tool, client?: PoolClient): Promise<ToolEntity> {
		
		const innerFunction = async (client: PoolClient): Promise<ToolEntity> => {
			// Check if the tool already exists
			const existingToolResult = await this.getToolByOwnerId(ownerId, tool.itemData.id);

			if (existingToolResult) {
				console.warn(`Tool ${tool.getToolId()} already exists in toolbox ${ownerId}`);
				return existingToolResult;
				// return makeToolObject(updateResult); 
			}
			
			const result = await this.createTool(ownerId, tool, client);

			// Check if result is valid
			if (!result) {
				throw new Error('There was an error creating the tool');
			}

			// Return the created Tool as an instance
			return result;
		}
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'addTool', client);

	}

	/**
	 * If the item does not exist, creates it for the specified toolbox. Obselete, as there is currently no point in updating a tool. Redirects to createTool.
	 * @ownerId the id of the toolbox that this item belongs to
	 * @tool the tool
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns a new ToolEntity with the corresponding data if success, null if failure (or throws error)
	*/
	async createOrUpdateTool(ownerId: string, tool: Tool, client?: PoolClient): Promise<ToolEntity> {
		return this.createTool(ownerId, tool, client);
		// const innerFunction = async (client: PoolClient): Promise<ToolEntity> => {
		// 	// Check if the item already exists
		// 	const existingItemResult = await client.query<ToolEntity>(
		// 		`SELECT id, owner, identifier FROM tools 
		// 		WHERE id = $1 OR (owner = $2 AND identifier = $3)`, 
		// 		[tool.getToolId(), ownerId, tool.itemData.id]
		// 	);

		// 	let result;

		// 	if (existingItemResult.rows.length > 0) {
		// 		// Item already exists
		// 		console.warn(`Tool ${tool.getToolId()} already exists in toolbox ${ownerId}`);
		// 		return existingItemResult.rows[0];
		// 	} else {
		// 		result = await this.createTool(ownerId, tool, client);
		// 		if (!result) {
		// 			throw new Error(`Error creating inventory item with id ${tool.getToolId()}`);
		// 		} 
		// 	}

		// 	return result;
		// };

		// // Call the transactionWrapper with the innerFunction and appropriate arguments
		// return transactionWrapper(innerFunction, 'createOrUpdateTool', client);
	}

	/**
	 * Deletes the specified tool from the database. Returns the deleted row.
	 * @id the id of the tool
	 * @returns a ToolEntity with the new data on success (or throws error)
	 */
	async deleteToolById(id: string, client?: PoolClient): Promise<ToolEntity> {
		const innerFunction = async (client: PoolClient): Promise<ToolEntity> => {
			// Lock the row for update
			const lockResult = await client.query<{id: string}>(
				'SELECT id FROM tools WHERE id = $1 FOR UPDATE',
				[id]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Tool not found for id: ${id}`);
			}
			const deleteResult = await client.query<ToolEntity>(
				'DELETE FROM tools WHERE id = $1 RETURNING id, owner, identifier',
				[id]
			);

			return deleteResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'deleteToolById', client);
	}


	/**
	 * Deletes the specified tool from the database. Returns the deleted row.
	 * @ownerId the id of the owner
	 * @identifier the item template id
	 * @returns a ToolEntity with the new data on success (or throws error)
	 */
	async deleteToolByOwnerId(ownerId: string, identifier: string, client?: PoolClient): Promise<ToolEntity> {
		const innerFunction = async (client: PoolClient): Promise<ToolEntity> => {
			// Lock the row for update
			const lockResult = await client.query<{id: string}>(
				'SELECT id FROM tools WHERE owner = $1 AND identifier = $2 FOR UPDATE',
				[ownerId, identifier]
			);

			if (lockResult.rows.length === 0) {
				throw new Error(`Tool not found for ownerId: ${ownerId}`);
			}
			const deleteResult = await client.query<ToolEntity>(
				'DELETE FROM tools WHERE owner = $1 AND identifier = $2 RETURNING id, owner, identifier',
				[ownerId, identifier]
			);

			return deleteResult.rows[0];
		};

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'deleteToolByOwnerId', client);
	}
}

const toolRepository = new ToolRepository();
export default toolRepository;
