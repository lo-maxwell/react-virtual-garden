import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import goosePenRepository from "@/backend/repositories/goose/goosePenRepository";
import gooseRepository from "@/backend/repositories/goose/gooseRepository";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import { GooseEntity } from "@/models/goose/Goose";
import GoosePen, { GoosePenEntity } from "@/models/goose/GoosePen";
import { InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { InventoryItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/InventoryItemTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import assert from "assert";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";

/**
 * Create a goose pen and all geese inside it (no-op on conflict).
 */
export async function createGoosePenInDatabase(
	pen: GoosePen,
	userId: string,
	client?: PoolClient
): Promise<boolean> {
	if (process.env.USE_DATABASE === "LAMBDA") {
		try {
			const geese = pen.getAllGeese();
			const payload: any = {
				queries: [
					{
						tableName: "goose_pens",
						columnsToWrite: ["id", "owner", "size"],
						values: [[pen.getId(), userId, pen.getSize()]],
						conflictColumns: ["id"],
						returnColumns: ["id"],
					},
				],
			};

			if (geese.length > 0) {
				const gooseValues = geese.map((g) => {
					const gp = g.toPlainObject();
					return [
						g.getId(),
						pen.getId(),           // owner = pen.id (goose belongs to pen)
						gp.name,
						gp.color,
						gp.birthday,
						gp.attributes ?? {},   // JSONB attributes
					];
				});

				payload.queries.push({
					tableName: "gooses",
					columnsToWrite: ["id", "owner", "name", "color", "birthday", "attributes"],
					values: gooseValues,
					conflictColumns: ["id"],
					returnColumns: ["id"],
				});
			}

			const insertResult = await invokeLambda("garden-insert", payload);
			if (!insertResult) throw new Error(`Failed to create goose pen ${pen.getId()}`);

			// optional: check counts
			// const penRows = parseRows<string[]>(insertResult[0]);
			// const gooseRows = geese.length > 0 ? parseRows<string[]>(insertResult[1]) : [];

			return true;
		} catch (err) {
			console.error("Error creating goose pen via Lambda:", err);
			throw err;
		}
	} else {
		throw new Error('CreateGoosePen is not implemented for non lambda mode');
	}
}


/**
 * Upsert (insert or update) a goose pen and upsert contained geese.
 */
export async function upsertGoosePenInDatabase(
	pen: GoosePen,
	userId: string,
	client?: PoolClient
): Promise<boolean> {
	if (process.env.USE_DATABASE === "LAMBDA") {
		try {
			const geese = pen.getAllGeese();
			const payload: any = {
				queries: [
					{
						tableName: "goose_pens",
						columnsToWrite: ["id", "owner", "size"],
						values: [[pen.getId(), userId, pen.getSize()]],
						conflictColumns: ["id"],
						updateQuery: {
							values: {
								size: { excluded: true } // replace as desired; here we choose excluded behavior
							},
							conditions: {
								owner: { operator: "=", value: userId }
							}
						},
						returnColumns: ["id"]
					}
				]
			};

			if (geese.length > 0) {
				const gooseValues = geese.map((g) => {
					const gp = g.toPlainObject();
					return [
						g.getId(),
						pen.getId(),
						gp.name,
						gp.color,
						gp.birthday,
						gp.attributes ?? {},
					];
				});

				payload.queries.push({
					tableName: "gooses",
					columnsToWrite: ["id", "owner", "name", "color", "birthday", "attributes"],
					values: gooseValues,
					conflictColumns: ["id"],
					updateQuery: {
						values: {
							name: { excluded: true },
							color: { excluded: true },
							birthday: { excluded: true },
							attributes: { excluded: true }
						},
						conditions: {}
					},
					returnColumns: ["id"]
				});
			}

			const res = await invokeLambda("garden-insert", payload);
			if (!res) throw new Error(`Failed to upsert goose pen ${pen.getId()}`);

			return true;
		} catch (err) {
			console.error("Error upserting goose pen via Lambda:", err);
			throw err;
		}
	} else {
		throw new Error('UpsertGoosePen is not implemented for non lambda mode');
	}
}

/**
 * Fetch a goose pen and its geese, verify owner, and return a plain object representation.
 */
export async function getGoosePenFromDatabase(
	penId: string,
	userId: string,
	client?: PoolClient
): Promise<GoosePen> {
	if (process.env.USE_DATABASE === "LAMBDA") {
		try {
			const payload = {
				queries: [
					{
						tableName: "goose_pens",
						returnColumns: ["id", "owner", "size"],
						conditions: {
							id: { operator: "=", value: penId },
							owner: { operator: "=", value: userId }
						},
						limit: 1
					},
					{
						tableName: "gooses",
						returnColumns: ["id", "owner", "name", "color", "birthday", "attributes"],
						conditions: {
							owner: { operator: "=", value: penId }
						},
						limit: 500
					}
				]
			};

			const queryResult = await invokeLambda("garden-select", payload);
			if (!queryResult) throw new Error(`Failed to fetch goose pen ${penId}`);

			const penRows = parseRows<any[]>(queryResult[0]);
			if (!penRows || penRows.length === 0) throw new Error(`No goose pen found for id ${penId}`);
			const penEntity = penRows[0];

			// validate pen (optional): goosePenRepository.validateGoosePenEntity(penEntity)

			const geeseRows = parseRows<any[]>(queryResult[1]) || [];
			// Optionally hydrate domain objects:
			const gooseObjs = geeseRows.map((r) => gooseRepository.makeGooseObject(r)); // or Goose.fromPlainObject(r)

			// Build plain object to return
			const penPlain: any = {
				id: penEntity.id,
				owner: penEntity.owner,
				size: penEntity.size,
				geese: gooseObjs.map((g: any) => g.toPlainObject ? g.toPlainObject() : g)
			};

			return penPlain;
		} catch (err) {
			console.error("Error fetching goose pen via Lambda:", err);
			throw err;
		}
	} else {
		throw new Error('GetGoosePen is not implemented for non lambda mode');
	}
}

/**
 * Changes the name of the target goose.
 */
export async function updateGooseName(userId: string, goosePenId: string, gooseId: string, newGooseName: string, client?: PoolClient): Promise<GooseEntity> {
	//Can put validation/business logic here
	if (newGooseName.length > 32 || newGooseName.length === 0) {
		throw new Error(`Invalid new goose name length`);
	}
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const fetch_payload = {
				"queries": [
					// Validate goose pen belongs to user
					{
						"tableName": "goose_pens",
						"returnColumns": ["id", "owner", "size"],
						"conditions": {
							"id": { "operator": "=", "value": goosePenId },
							"owner": { "operator": "=", "value": userId }
						},
						"limit": 1
					},
					// Validate goose belongs to goose pen
					{
						"tableName": "gooses",
						"returnColumns": [
							"id",
							"owner",
							"name",
							"color",
							"birthday",
							"attributes"
						],
						"conditions": {
							"id": { "operator": "=", "value": gooseId },
							"owner": { "operator": "=", "value": goosePenId }
						},
						"limit": 1
					}
				]
			};

			// Fetch entities for validation
			const fetchResult = await invokeLambda("garden-select", fetch_payload);
			if (!fetchResult) throw new Error("Failed to return values from lambda");

			const goosePenEntity = parseRows<GoosePenEntity[]>(fetchResult[0])[0];
			assert(goosePenRepository.validateGoosePenEntity(goosePenEntity));

			const gooseEntity = parseRows<GooseEntity[]>(fetchResult[1])[0];
			assert(gooseRepository.validateGooseEntity(gooseRepository.normalizeGooseEntity(gooseEntity)));

			// Now perform the update — goose name
			const update_payload = {
				"queries": [
					{
						"tableName": "gooses",
						"values": {
							"name": newGooseName
						},
						"returnColumns": [
							"id",
							"owner",
							"name",
							"color",
							"birthday",
							"attributes"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gooseId
							},
							"owner": {
								"operator": "=",
								"value": goosePenId
							}
						}
					}
				]
			};

			const updateResult = await invokeLambda("garden-update", update_payload);
			if (!updateResult) throw new Error("Failed to update goose name");

			const rawGoose = parseRows<GooseEntity[]>(updateResult[0])[0];
			const updatedGooseEntity = gooseRepository.normalizeGooseEntity(rawGoose);
			assert(gooseRepository.validateGooseEntity(updatedGooseEntity));

			return updatedGooseEntity;

		} catch (error) {
			console.error("Error updating goose name via Lambda:", error);
			throw error;
		}
	}

	throw new Error("updateGooseName is not implemented for non-Lambda mode");
}


/**
 * Feeds a goose using a harvested inventory item. This function performs:
 * 
 * 1. Validation of ownership relationships:
 *    - The inventory belongs to the user.
 *    - The inventory item belongs to the inventory.
 *    - The goose pen belongs to the user.
 *    - The goose belongs to the goose pen.
 *
 * 2. Validation that the selected inventory item is a valid harvested item
 *    and that the user owns enough quantity to feed the goose.
 *
 * 3. Fetches the goose, goose pen, inventory, and inventory item using the
 *    garden-select Lambda.
 *
 * 4. Calculates mood change using the harvested item template and the amount fed.
 *    The goose’s JSONB `attributes` object is updated in JavaScript and written
 *    back via garden-update Lambda.
 *
 * 5. Decrements the inventory item quantity by 1 (or `feedQuantity`, if extended).
 *
 * @async
 * @function feedGoose
 *
 * @param {string} userId
 *   The ID of the user attempting to feed the goose.
 *
 * @param {string} goosePenId
 *   The ID of the goose pen that should contain the target goose.
 *
 * @param {string} gooseId
 *   The ID of the goose being fed.
 *
 * @param {string} inventoryId
 *   The ID of the user’s inventory used to source the feed item.
 *
 * @param {string} inventoryItemIdentifier
 *   The identifier of the harvested inventory item being fed to the goose.
 *
 * @param {number} feedQuantity
 *   The amount of the feed item the user intends to consume.
 *
 * @param {PoolClient} [client]
 *   Optional PostgreSQL transaction client (not used in Lambda mode).
 *
 * @returns {Promise<GooseEntity>}
 *   The updated goose entity with modified `attributes` (particularly mood).
 *
 * @throws {Error}
 *   - If any resource fails validation (ownership, item type, quantities)
 *   - If Lambda selection or update queries fail
 *   - If any entity fails schema validation
 *   - If USE_DATABASE !== 'LAMBDA'
 *
 * @description
 * This function encapsulates the full feeding workflow when running in Lambda
 * mode. It centralizes validation, entity loading, mood calculation, JSONB
 * mutation, and database write-back into a single atomic operation. This
 * prevents partial updates and keeps goose-feeding logic consistent across
 * the system.
 */
export async function feedGoose(userId: string, goosePenId: string, gooseId: string, inventoryId: string, inventoryItemIdentifier: string, feedQuantity: number, client?: PoolClient): Promise<GooseEntity> {
	//Can put validation/business logic here
	function validateCanFeedGooseItem(inventoryItemEntity: InventoryItemEntity, inventoryEntity: InventoryEntity, gooseEntity: GooseEntity, goosePenEntity: GoosePenEntity): HarvestedItemTemplate {
		const harvestedItemTemplate = itemTemplateFactory.getInventoryTemplateById(inventoryItemEntity.identifier);
		if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
			throw new Error(`Could not find valid harvested item matching identifier ${inventoryItemEntity.identifier}`);
		}

		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory item ${inventoryItemEntity.id} is not owned by owner ${inventoryEntity.id}`);
		}

		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (inventoryItemEntity.quantity < feedQuantity) {
			throw new Error(`Inventory item lacks required quantity`);
		}

		if (gooseEntity.owner !== goosePenEntity.id) {
			throw new Error(`Goose ${gooseEntity.id} is not owned by goose pen ${goosePenEntity.id}`);
		}

		if (goosePenEntity.owner !== userId) {
			throw new Error(`Goose pen ${goosePenEntity.id} is not owned by user ${userId}`);
		}

		return harvestedItemTemplate;
	}


	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const fetch_payload = {
				"queries": [
					{
						"tableName": "goose_pens",
						"returnColumns": [
							"id",
							"owner",
							"size"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": goosePenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "gooses",
						"returnColumns": [
							"id",
							"owner",
							"name",
							"color",
							"birthday",
							"attributes"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gooseId
							},
							"owner": {
								"operator": "=",
								"value": goosePenId
							}
						},
						"limit": 1
					},
					{
						"tableName": "inventories",
						"returnColumns": [
							"id",
							"owner",
							"gold"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": inventoryId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "inventory_items",
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": inventoryId
							},
							"identifier": {
								"operator": "=",
								"value": inventoryItemIdentifier
							}
						},
						"limit": 1
					}
				]
			}

			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const goosePenEntity = parseRows<GoosePenEntity[]>(fetchQueryResult[0])[0];
			assert(goosePenRepository.validateGoosePenEntity(goosePenEntity));
			const gooseEntity = parseRows<GooseEntity[]>(fetchQueryResult[1])[0];
			assert(gooseRepository.validateGooseEntity(gooseRepository.normalizeGooseEntity(gooseEntity)));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const inventoryItemEntity = parseRows<InventoryItemEntity[]>(fetchQueryResult[3])[0];
			assert(inventoryItemRepository.validateInventoryItemEntity(inventoryItemEntity));

			//Check that we can feed the goose
			const harvestedItemTemplate = validateCanFeedGooseItem(inventoryItemEntity, inventoryEntity, gooseEntity, goosePenEntity);
			const currentGoose = gooseRepository.makeGooseObject(gooseEntity);
			const moodChange = currentGoose.getMoodChangeFromItem(harvestedItemTemplate) * feedQuantity;

			const update_payload = {
				"queries": [
					{
						"tableName": "gooses",
						"values": {
							"attributes": [
								{
									"operator": "jsonb_inc",
									"path": ["mood"],
									"value": moodChange
								}
							]
						},
						"returnColumns": [
							"id",
							"owner",
							"name",
							"color",
							"birthday",
							"attributes"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gooseEntity.id
							},
							"owner": {
								"operator": "=",
								"value": goosePenEntity.id
							}
						}
					},
					{
						"tableName": "inventory_items",
						"values": {
							"quantity": {
								"operator": "-",
								"value": feedQuantity
							}
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": inventoryItemEntity.id
							},
							"owner": {
								"operator": "=",
								"value": inventoryEntity.id
							},
							"identifier": {
								"operator": "=",
								"value": inventoryItemEntity.identifier
							}
						}
					}
				]
			}
			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Failed to update from lambda`);
			}
			const resultingGooseEntity = parseRows<GooseEntity[]>(updateQueryResult[0])[0];
			return resultingGooseEntity;

		} catch (error) {
			console.error("Error feeding goose via Lambda:", error);
			throw error;
		}
	}

	throw new Error("feedGoose is not implemented for non-Lambda mode");
}