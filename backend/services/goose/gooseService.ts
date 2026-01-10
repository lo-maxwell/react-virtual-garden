import { invokeLambda, parseRows, parseSingleRow } from "@/backend/lambda/invokeLambda";
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
							"attributes",
							"status",
							"sold_at",
							"sold_price"
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
							"attributes",
							"status",
							"sold_at",
							"sold_price"
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
							"attributes",
							"status",
							"sold_at",
							"sold_price"
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
							"attributes",
							"status",
							"sold_at",
							"sold_price"
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

export async function sellGoose(userId: string, goosePenId: string, gooseId: string, inventoryId: string, client?: PoolClient): Promise<GooseEntity> {
	//Can put validation/business logic here
	function validateCanSellGoose(inventoryEntity: InventoryEntity, gooseEntity: GooseEntity, goosePenEntity: GoosePenEntity) {
		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (gooseEntity.owner !== goosePenEntity.id) {
			throw new Error(`Goose ${gooseEntity.id} is not owned by goose pen ${goosePenEntity.id}`);
		}

		if (goosePenEntity.owner !== userId) {
			throw new Error(`Goose pen ${goosePenEntity.id} is not owned by user ${userId}`);
		}

		return;
	}


	if (process.env.USE_DATABASE === 'LAMBDA') {
		//TODO
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
							"attributes",
							"status",
							"sold_at",
							"sold_price"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gooseId
							},
							"owner": {
								"operator": "=",
								"value": goosePenId
							},
							"status": {
								"operator": "=",
								"value": 'active' //cannot be 'sold' if we are selling
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
					}
				]
			}

			const fetchQueryResult = await invokeLambda('garden-select', fetch_payload);
			if (!fetchQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const goosePenEntity = parseSingleRow<GoosePenEntity>(fetchQueryResult[0]);
			assert(goosePenRepository.validateGoosePenEntity(goosePenEntity));
			const gooseEntity = parseSingleRow<GooseEntity>(fetchQueryResult[1]);
			assert(gooseRepository.validateGooseEntity(gooseRepository.normalizeGooseEntity(gooseEntity)));
			const inventoryEntity = parseSingleRow<InventoryEntity>(fetchQueryResult[2]);
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));

			//Check that we can sell the goose
			validateCanSellGoose(inventoryEntity, gooseEntity, goosePenEntity);
			const currentGoose = gooseRepository.makeGooseObject(gooseEntity);
			const sellPrice = currentGoose.getSellPrice();
			const sellTime = new Date(Date.now());

			const update_payload = {
				"queries": [
					{
						"tableName": "gooses",
						"values": {
							"status": "sold",
							"sold_at": sellTime,
							"sold_price": sellPrice
						},
						"returnColumns": [
							"id",
							"owner",
							"name",
							"color",
							"birthday",
							"attributes",
							"status",
							"sold_at",
							"sold_price"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gooseEntity.id
							},
							"owner": {
								"operator": "=",
								"value": goosePenEntity.id
							},
							"status": {
								"operator": "=",
								"value": "active"
							}
						}
					},
					{
						"tableName": "inventories",
						"values": {
							"gold": {
								"operator": "+",
								"value": sellPrice
							}
						},
						"returnColumns": [
							"id",
							"owner",
							"gold"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": inventoryEntity.id
							},
							"owner": {
								"operator": "=",
								"value": userId
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
			console.error("Error selling goose via Lambda:", error);
			throw error;
		}
	}

	throw new Error("sellGoose is not implemented for non-Lambda mode");
}