import plotRepository from "@/backend/repositories/garden/plot/plotRepository";
import inventoryItemRepository from "@/backend/repositories/items/inventoryItem/inventoryItemRepository";
import placedItemRepository from "@/backend/repositories/items/placedItem/placedItemRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import userRepository from "@/backend/repositories/user/userRepository";
import { Plot, PlotEntity } from "@/models/garden/Plot";
import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItem, PlacedItemDetailsEntity, PlacedItemEntity } from "@/models/items/placedItems/PlacedItem";
import { BlueprintTemplate } from "@/models/items/templates/models/BlueprintTemplate";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";
import { stringToBigIntNumber } from "@/models/utility/BigInt";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from 'uuid';
import { transactionWrapper } from "../../utility/utility";
import { actionHistoryFactory } from "@/models/user/history/actionHistory/ActionHistoryFactory";
import ItemHistory, { ItemHistoryEntity } from "@/models/user/history/itemHistory/ItemHistory";
import actionHistoryRepository from "@/backend/repositories/user/actionHistoryRepository";
import itemHistoryRepository from "@/backend/repositories/user/itemHistoryRepository";
import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import assert from "assert";
import { InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import { GardenEntity } from "@/models/garden/Garden";
import gardenRepository from "@/backend/repositories/garden/gardenRepository";
import { DecorationTemplate } from "@/models/items/templates/models/DecorationTemplate";
import { ActionHistoryEntity } from "@/models/user/history/actionHistory/ActionHistory";
import { HarvestedItemTemplate } from "@/models/items/templates/models/HarvestedItemTemplate";
import { LevelSystemEntity } from "@/models/level/LevelSystem";

//TODO: Validate that plots are within garden bounds
//TODO: Add level requirement to plant/place
/**
 * Attempts to plant a seed, removing the respective seed item from the inventory.
 * @gardenId the garden containing this plot
 * @plotId the plot to add the item to
 * @inventoryId the inventory to remove the seed from
 * @inventoryItemIdentifier the seed id
 * @userId the user to verify
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function plantSeed(gardenId: string, plotId: string, inventoryId: string, inventoryItemIdentifier: string, userId: string, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	function validateCanPlantSeed(inventoryItemEntity: InventoryItemEntity, inventoryEntity: InventoryEntity, placedItemEntity: PlacedItemEntity, plotEntity: PlotEntity, gardenEntity: GardenEntity): PlantTemplate {
		const seedItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier);
		if (!seedItemTemplate || seedItemTemplate.subtype !== ItemSubtypes.SEED.name) {
			throw new Error(`Could not find valid seed matching identifier ${inventoryItemEntity.identifier}`);
		}

		const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate((seedItemTemplate as SeedTemplate).transformId) as PlantTemplate;
		if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
			throw new Error(`Could not find valid plant matching identifier ${(seedItemTemplate as SeedTemplate).transformId}`);
		}

		//Check if placement is valid
		//make sure inventory contains item
		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory item ${inventoryItemEntity.id} is not owned by owner ${inventoryEntity.id}`);
		}

		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (inventoryItemEntity.quantity < 1) {
			throw new Error(`Inventory item lacks required quantity`);
		}

		if (placedItemEntity.owner !== plotEntity.id) {
			throw new Error(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
		}

		if (plotEntity.owner !== gardenEntity.id) {
			throw new Error(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			throw new Error(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
		}

		//make sure current plot contains ground
		const currentPlotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!currentPlotItemTemplate || currentPlotItemTemplate.subtype !== ItemSubtypes.GROUND.name) {
			throw new Error(`Could not find valid ground matching identifier ${placedItemEntity.identifier}`);
		}

		assert('baseExp' in plantItemTemplate && 'growTime' in plantItemTemplate && 'repeatedGrowTime' in plantItemTemplate && 'numHarvests' in plantItemTemplate && 'transformShinyIds' in plantItemTemplate)

		return plantItemTemplate;
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 and owner = $2'
			// 'SELECT id, owner, row_index, col_index, plant_time, uses_remaining, random_seed FROM plots WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, gold FROM inventories WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, identifier, quantity FROM inventory_items WHERE owner = $1 AND identifier = $2'
			// 'SELECT id, owner, identifier, status FROM placed_items WHERE owner = $1'
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "plots",
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
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
					},
					{
						"tableName": "placed_items",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"status"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": plotId
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
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const plotEntity = parseRows<PlotEntity[]>(fetchQueryResult[1])[0];
			assert(plotRepository.validatePlotEntity(plotEntity));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const inventoryItemEntity = parseRows<InventoryItemEntity[]>(fetchQueryResult[3])[0];
			assert(inventoryItemRepository.validateInventoryItemEntity(inventoryItemEntity));
			const placedItemEntity = parseRows<PlacedItemEntity[]>(fetchQueryResult[4])[0];
			assert(placedItemRepository.validatePlacedItemEntity(placedItemEntity));

			//Check that we can plant seed
			const plantItemTemplate = validateCanPlantSeed(inventoryItemEntity, inventoryEntity, placedItemEntity, plotEntity, gardenEntity) as PlantTemplate;

			// 'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = $3 AND owner = $4'
			// 'UPDATE placed_items SET identifier = $1, status = $2 WHERE id = $3 AND owner = $4'
			// 'UPDATE inventory_items SET quantity = quantity - 1 WHERE id = $1 AND owner = $2 AND identifier = $3'
			const update_payload = {
				"queries": [
					{
						"tableName": "plots",
						"values": {
							"plant_time": currentTime,
							"uses_remaining": plantItemTemplate.numHarvests
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						}
					},
					{
						"tableName": "placed_items",
						"values": {
							"identifier": plantItemTemplate.id,
							"status": ""
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": placedItemEntity.id
							},
							"owner": {
								"operator": "=",
								"value": plotEntity.id
							}
						}
					},
					{
						"tableName": "inventory_items",
						"values": {
							"quantity": {
								"operator": "-",
								"value": 1
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
			return true;
		} catch (error) {
			console.error('Error planting seed from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient): Promise<boolean> => {

			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId),
				plotRepository.getPlotById(plotId),
				inventoryRepository.getInventoryById(inventoryId),
				placedItemRepository.getPlacedItemByPlotId(plotId),
				inventoryItemRepository.getInventoryItemByOwnerId(inventoryId, inventoryItemIdentifier)
			]);

			// Destructure the results for easier access
			const [gardenResult, plotResult, inventoryResult, placedItemResult, inventoryItemResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (plotResult.status === 'rejected' || plotResult.value === null) {
				throw new Error(`Could not find plot matching id ${plotId}`);
			}
			if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
				throw new Error(`Could not find inventory matching id ${inventoryId}`);
			}
			if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
				throw new Error(`Could not find placedItem matching plot id ${plotId}`);
			}
			if (inventoryItemResult.status === 'rejected' || inventoryItemResult.value === null) {
				throw new Error(`Could not find inventoryItem matching identifier ${inventoryItemIdentifier}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;
			const plotEntity = plotResult.value;
			const inventoryEntity = inventoryResult.value;
			const inventoryItemEntity = inventoryItemResult.value;
			const placedItemEntity = placedItemResult.value;

			const plantItemTemplate = validateCanPlantSeed(inventoryItemEntity, inventoryEntity, placedItemEntity, plotEntity, gardenEntity);

			//placement is OK

			//remove 1 quantity of the seed from inventory
			await inventoryItemRepository.updateInventoryItemQuantity(inventoryItemEntity.id, -1, client);

			//plot details are updated
			
			await plotRepository.setPlotDetails(plotId, currentTime, (plantItemTemplate as PlantTemplate).numHarvests, client);
			await placedItemRepository.replacePlacedItemByPlotId(plotId, plantItemTemplate.id, '', client);

			return true;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'PlantSeed', client);
	}
}

/**
 * Attempts to place a decoration, removing the respective blueprint item from the inventory.
 * @gardenId the garden containing this plot
 * @plotId the plot to add the item to
 * @inventoryId the inventory to remove the blueprint from
 * @inventoryItemIdentifier the blueprint id
 * @userId the user to verify with, and update history for
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function placeDecoration(gardenId: string, plotId: string, inventoryId: string, inventoryItemIdentifier: string, userId: string, client?: PoolClient): Promise<boolean> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	function validateCanPlaceDecoration(inventoryItemEntity: InventoryItemEntity, inventoryEntity: InventoryEntity, placedItemEntity: PlacedItemEntity, plotEntity: PlotEntity, gardenEntity: GardenEntity): {blueprintItemTemplate: BlueprintTemplate, decorationItemTemplate: DecorationTemplate} {
		
		const blueprintItemTemplate = placeholderItemTemplates.getInventoryTemplate(inventoryItemEntity.identifier) as BlueprintTemplate;
		if (!blueprintItemTemplate || blueprintItemTemplate.subtype !== ItemSubtypes.BLUEPRINT.name) {
			throw new Error(`Could not find valid blueprint matching identifier ${inventoryItemEntity.identifier}`);
		}

		assert('transformId' in blueprintItemTemplate);

		const decorationItemTemplate = placeholderItemTemplates.getPlacedTemplate((blueprintItemTemplate as BlueprintTemplate).transformId) as DecorationTemplate;
		if (!decorationItemTemplate || decorationItemTemplate.subtype !== ItemSubtypes.DECORATION.name) {
			throw new Error(`Could not find valid decoration matching identifier ${(blueprintItemTemplate as BlueprintTemplate).transformId}`);
		}

		
		//Check if placement is valid
		//make sure inventory contains item
		if (inventoryItemEntity.owner !== inventoryEntity.id) {
			throw new Error(`Inventory item ${inventoryItemEntity.id} is not owned by owner ${inventoryEntity.id}`);
		}

		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (inventoryItemEntity.quantity < 1) {
			throw new Error(`Inventory item lacks required quantity`);
		}

		if (placedItemEntity.owner !== plotEntity.id) {
			throw new Error(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
		}



		if (plotEntity.owner !== gardenEntity.id) {
			console.warn(plotEntity);
			console.warn(gardenEntity);
			throw new Error(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			throw new Error(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
		}

		//Decorations have the same parameters as placedItems, so we only have to check the subtype field

		return {blueprintItemTemplate: blueprintItemTemplate, decorationItemTemplate: decorationItemTemplate};
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 and owner = $2'
			// 'SELECT id, owner, row_index, col_index, plant_time, uses_remaining, random_seed FROM plots WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, gold FROM inventories WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, identifier, quantity FROM inventory_items WHERE owner = $1 AND identifier = $2'
			// 'SELECT id, owner, identifier, status FROM placed_items WHERE owner = $1'
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "plots",
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
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
					},
					{
						"tableName": "placed_items",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"status"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": plotId
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
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const plotEntity = parseRows<PlotEntity[]>(fetchQueryResult[1])[0];
			assert(plotRepository.validatePlotEntity(plotEntity));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const inventoryItemEntity = parseRows<InventoryItemEntity[]>(fetchQueryResult[3])[0];
			assert(inventoryItemRepository.validateInventoryItemEntity(inventoryItemEntity));
			const placedItemEntity = parseRows<PlacedItemEntity[]>(fetchQueryResult[4])[0];
			assert(placedItemRepository.validatePlacedItemEntity(placedItemEntity));

			//Check that we can place decoration
			const {blueprintItemTemplate, decorationItemTemplate} = validateCanPlaceDecoration(inventoryItemEntity, inventoryEntity, placedItemEntity, plotEntity, gardenEntity);

			const decorationCategoryHistory = actionHistoryFactory.createActionHistoryByIdentifiers(ItemSubtypes.DECORATION.name, blueprintItemTemplate.category, 'placed', 1); // Updated to 'picked'
			if (!decorationCategoryHistory) throw new Error(`Could not create action history from identifier category ${blueprintItemTemplate.category}`);
			
			const history_fetch_payload = {
				"queries": [
					{
						"tableName": "action_histories",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							},
							"identifier": {
								"operator": "=",
								"value": decorationCategoryHistory.getIdentifier()
							}
						},
						"limit": 1
					},
					{
						"tableName": "item_histories",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							},
							"identifier": {
								"operator": "=",
								"value": blueprintItemTemplate.id
							}
						},
						"limit": 1
					}
				]
			}

			const fetchHistoryQueryResult = await invokeLambda('garden-select', history_fetch_payload);
			if (!fetchHistoryQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const actionHistoryEntityList = parseRows<ActionHistoryEntity[]>(fetchHistoryQueryResult[0]);
			const itemHistoryEntityList = parseRows<ItemHistoryEntity[]>(fetchHistoryQueryResult[1]);
			const actionHistoryEntity = (Array.isArray(actionHistoryEntityList) && actionHistoryEntityList.length > 0) ? actionHistoryEntityList[0] : null;
			if (actionHistoryEntity) assert(actionHistoryRepository.validateActionHistoryEntity(actionHistoryEntity));
			const itemHistoryEntity = (Array.isArray(itemHistoryEntityList) && itemHistoryEntityList.length > 0) ? itemHistoryEntityList[0] : null;
			if (itemHistoryEntity) assert(itemHistoryRepository.validateItemHistoryEntity(itemHistoryEntity));

			//Only if the action history does not exist
			if (!actionHistoryEntity) {
				const insert_payload = {
					"queries": [
						{
							"tableName": "action_histories",
							"columnsToWrite": [
							  "owner",
							  "identifier",
							  "quantity"
							],
							"values": [
							  [
								userId,
								decorationCategoryHistory.getIdentifier(),
								1
							  ]
							],
							"conflictColumns": [
							  "owner",
							  "identifier"
							],
							"returnColumns": [
							  "id",
							  "owner",
							  "identifier",
							  "quantity"
							]
						  }
					]
				};
				const insertActionHistoryResult = await invokeLambda('garden-insert', insert_payload);
			}

			//Only if the item history does not exist
			if (!itemHistoryEntity) {
				const insert_payload = {
					"queries": [
						{
							"tableName": "item_histories",
							"columnsToWrite": [
							  "owner",
							  "identifier",
							  "quantity"
							],
							"values": [
							  [
								userId,
								blueprintItemTemplate.id,
								1
							  ]
							],
							"conflictColumns": [
							  "owner",
							  "identifier"
							],
							"returnColumns": [
							  "id",
							  "owner",
							  "identifier",
							  "quantity"
							]
						  }
					]
				};
				const insertItemHistoryResult = await invokeLambda('garden-insert', insert_payload);
			}

			// 'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = $3 AND owner = $4'
			// 'UPDATE placed_items SET identifier = $1, status = $2 WHERE id = $3 AND owner = $4'
			// 'UPDATE inventory_items SET quantity = quantity - 1 WHERE id = $1 AND owner = $2 AND identifier = $3'
			const update_payload = {
				"queries": [
					{
						"tableName": "plots",
						"values": {
							"plant_time": currentTime,
							"uses_remaining": 0
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						}
					},
					{
						"tableName": "placed_items",
						"values": {
							"identifier": decorationItemTemplate.id,
							"status": ""
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": placedItemEntity.id
							},
							"owner": {
								"operator": "=",
								"value": plotEntity.id
							}
						}
					},
					{
						"tableName": "inventory_items",
						"values": {
							"quantity": {
								"operator": "-",
								"value": 1
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

			if (actionHistoryEntity) {
				update_payload.queries.push({
					"tableName": "action_histories",
					"values": {
						"quantity": {
							"operator": "+",
							"value": 1
						  }
					},
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": actionHistoryEntity.id
						},
						"owner": {
							"operator": "=",
							"value": userId
						},
						"identifier": {
							"operator": "=",
							"value": actionHistoryEntity.identifier
						}
					}
				})
			}

			if (itemHistoryEntity) {
				update_payload.queries.push({
					"tableName": "item_histories",
					"values": {
						"quantity": {
							"operator": "+",
							"value": 1
						  }
					},
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": itemHistoryEntity.id
						},
						"owner": {
							"operator": "=",
							"value": userId
						},
						"identifier": {
							"operator": "=",
							"value": itemHistoryEntity.identifier
						}
					}
				})
			}
			

			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Failed to update from lambda`);
			}
			return true;
		} catch (error) {
			console.error('Error planting seed from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient): Promise<boolean> => {

			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId),
				plotRepository.getPlotById(plotId),
				inventoryRepository.getInventoryById(inventoryId),
				placedItemRepository.getPlacedItemByPlotId(plotId),
				inventoryItemRepository.getInventoryItemByOwnerId(inventoryId, inventoryItemIdentifier)
			]);

			// Destructure the results for easier access
			const [gardenResult, plotResult, inventoryResult, placedItemResult, inventoryItemResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (plotResult.status === 'rejected' || plotResult.value === null) {
				throw new Error(`Could not find plot matching id ${plotId}`);
			}
			if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
				throw new Error(`Could not find inventory matching id ${inventoryId}`);
			}
			if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
				throw new Error(`Could not find placedItem matching plot id ${plotId}`);
			}
			if (inventoryItemResult.status === 'rejected' || inventoryItemResult.value === null) {
				throw new Error(`Could not find inventoryItem matching identifier ${inventoryItemIdentifier}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;
			const plotEntity = plotResult.value;
			const inventoryEntity = inventoryResult.value;
			const inventoryItemEntity = inventoryItemResult.value;
			const placedItemEntity = placedItemResult.value;
			
			const {blueprintItemTemplate, decorationItemTemplate} = validateCanPlaceDecoration(inventoryItemEntity, inventoryEntity, placedItemEntity, plotEntity, gardenEntity);
			//placement is OK

			//remove 1 quantity of the blueprint from inventory
			await inventoryItemRepository.updateInventoryItemQuantity(inventoryItemEntity.id, -1, client);

			//plot details are updated
			//Decorations always have 0 uses remaining, until we change something
			await plotRepository.setPlotDetails(plotId, currentTime, 0, client);
			await placedItemRepository.replacePlacedItemByPlotId(plotId, decorationItemTemplate.id, '', client);

			//histories are updated
			//action histories
			//decoration: all		
			//decoration: category
			// decorations don't have an all category right now
			// const decorationAllHistory = actionHistoryFactory.createActionHistoryByIdentifiers(blueprintItemTemplate.subtype, 'all', 'placed', 1); // Updated to 'picked'
			// if (!decorationAllHistory) throw new Error(`Could not create action history from identifier category all`);
			const decorationCategoryHistory = actionHistoryFactory.createActionHistoryByIdentifiers(ItemSubtypes.DECORATION.name, blueprintItemTemplate.category, 'placed', 1); // Updated to 'picked'
			if (!decorationCategoryHistory) throw new Error(`Could not create action history from identifier category ${blueprintItemTemplate.category}`);
			
			// await actionHistoryRepository.addActionHistory(userId, decorationAllHistory, client);
			
			await actionHistoryRepository.addActionHistory(userId, decorationCategoryHistory, client);
		
			//specific item history
			const itemHistory = new ItemHistory(uuidv4(), blueprintItemTemplate, 1);
			
			await itemHistoryRepository.addItemHistory(userId, itemHistory, client);	
			
			return true;
		} 
		
		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'PlaceDecoration', client);
	}
}

interface harvestPlotObjects {
	plainLevelSystemObject: any,
	plainPlotObject: any,
	plainInventoryItemObject: any
}

/**
 * Attempts to harvest a plot, removing the item from it and adding it to the inventory.
 * TODO: In most cases users can only harvest 1 item at a time, need additional validation to ensure that users don't spoof numHarvests
 * Gains xp on success.
 * @gardenId the garden containing this plot
 * @plotId the plot to remove the item from
 * @inventoryId the inventory to add the harvested item to
 * @levelSystemId the level system to add xp to
 * @userId the user to grab history from, and verify ownership
 * @numHarvests the number of harvests to attempt
 * @replacementItem a placedItemDetailsEntity to replace the plot if its usesRemaining drop to 0, defaults to ground
 * @instantHarvestKey if matches the key in the environment, ignores harvest timers
 * @client if null, creates a new client
 * @returns an object containing the harvested item on success (or throws error)
 */
export async function harvestPlot(gardenId: string, plotId: string, inventoryId: string, levelSystemId: string, userId: string, numHarvests: number, replacementItem?: PlacedItemDetailsEntity, instantHarvestKey?: string, client?: PoolClient): Promise<InventoryItemEntity> {
	//We always check based on current time
	const currentTime = Date.now();
	if (numHarvests <= 0) {
		throw new Error(`Invalid number of harvests`);
	}

	function validateCanHarvestPlant(inventoryEntity: InventoryEntity, placedItemEntity: PlacedItemEntity, plotEntity: PlotEntity, gardenEntity: GardenEntity, levelSystemEntity: LevelSystemEntity): {plantItemTemplate: PlantTemplate, harvestedItemTemplate: HarvestedItemTemplate} {
		const plantItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier) as PlantTemplate;
		if (!plantItemTemplate || plantItemTemplate.subtype !== ItemSubtypes.PLANT.name) {
			throw new Error(`Could not find valid plant matching identifier ${placedItemEntity.identifier}`);
		}
		assert('baseExp' in plantItemTemplate && 'growTime' in plantItemTemplate && 'repeatedGrowTime' in plantItemTemplate && 'numHarvests' in plantItemTemplate && 'transformShinyIds' in plantItemTemplate)

		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (placedItemEntity.owner !== plotEntity.id) {
			throw new Error(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
		}

		if (plotEntity.owner !== gardenEntity.id) {
			throw new Error(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			throw new Error(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
		}

		const shinyTier = Plot.checkShinyHarvest(plantItemTemplate as PlantTemplate, plotEntity.random_seed, Plot.baseShinyChance);
		let harvestedItemTemplate;
		if (shinyTier === 'Regular') {
			harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate(plantItemTemplate.transformId);
		} else {
			harvestedItemTemplate = placeholderItemTemplates.getInventoryTemplate((plantItemTemplate as PlantTemplate).transformShinyIds[shinyTier].id);
		}

		if (!harvestedItemTemplate || harvestedItemTemplate.subtype !== ItemSubtypes.HARVESTED.name) {
			throw new Error(`Could not find valid harvestedItem matching identifier ${plantItemTemplate.transformId}`);
		}

		const plantTime = stringToBigIntNumber(plotEntity.plant_time);
		if (!plantTime) {
			throw new Error(`Error converting plantTime ${plotEntity.plant_time} to number`);
		}
		
		const instantGrow = process.env.INSTANT_HARVEST_KEY === instantHarvestKey && process.env.INSTANT_HARVEST_KEY !== undefined;
		const REAL_TIME_FUDGE = 2500; //Allow for 2.5s discrepancy between harvest times

		//Check if harvest is valid
		if (!instantGrow && !Plot.canHarvest(plantItemTemplate, plantTime - REAL_TIME_FUDGE, plotEntity.uses_remaining, currentTime)) {
			throw new Error(`Cannot harvest plant at this time`);
		}

		return {plantItemTemplate: plantItemTemplate, harvestedItemTemplate: harvestedItemTemplate};
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "plots",
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
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
						"tableName": "placed_items",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"status"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": plotId
							}
						},
						"limit": 1
					},
					{
						"tableName": "levels",
						"returnColumns": [
							"id",
							"total_xp",
							"growth_rate"
						],
						"conditions": {
							"owner_uid": {
								"operator": "=",
								"value": userId
							},
							"owner_type": {
								"operator": "=",
								"value": "user"
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
			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const plotEntity = parseRows<PlotEntity[]>(fetchQueryResult[1])[0];
			assert(plotRepository.validatePlotEntity(plotEntity));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const placedItemEntity = parseRows<PlacedItemEntity[]>(fetchQueryResult[3])[0];
			assert(placedItemRepository.validatePlacedItemEntity(placedItemEntity));
			const levelSystemEntity = parseRows<LevelSystemEntity[]>(fetchQueryResult[4])[0];
			assert(levelRepository.validateLevelSystemEntity(levelSystemEntity));

			//Check that we can harvest plant
			const {plantItemTemplate, harvestedItemTemplate} = validateCanHarvestPlant(inventoryEntity, placedItemEntity, plotEntity, gardenEntity, levelSystemEntity);

			//harvest is OK
			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}

			//plot details are updated
			const possibleHarvests = Math.min(numHarvests, plotEntity.uses_remaining);
			const replaceItemFlag = possibleHarvests >= plotEntity.uses_remaining;

			const harvestAllHistory = actionHistoryFactory.createActionHistoryByIdentifiers(plantItemTemplate.subtype, 'all', 'harvested', 1);
			if (!harvestAllHistory) throw new Error(`Could not create action history from identifier category all`);
			const harvestCategoryHistory = actionHistoryFactory.createActionHistoryByIdentifiers(plantItemTemplate.subtype, plantItemTemplate.category, 'harvested', 1);
			if (!harvestCategoryHistory) throw new Error(`Could not create action history from identifier category ${plantItemTemplate.category}`);
			
			const fetch_payload_2 = {
				"queries": [
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
								"value": harvestedItemTemplate.id
							}
						},
						"limit": 1
					},
					{
						"tableName": "action_histories",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							},
							"identifier": {
								"operator": "=",
								"value": harvestAllHistory.getIdentifier()
							}
						},
						"limit": 1
					},
					{
						"tableName": "action_histories",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							},
							"identifier": {
								"operator": "=",
								"value": harvestCategoryHistory.getIdentifier()
							}
						},
						"limit": 1
					},
					{
						"tableName": "item_histories",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"quantity"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							},
							"identifier": {
								"operator": "=",
								"value": harvestedItemTemplate.id
							}
						},
						"limit": 1
					}
				]
			}

			const fetchExistingQueryResult = await invokeLambda('garden-select', fetch_payload_2);
			if (!fetchExistingQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const inventoryItemEntityList = parseRows<InventoryItemEntity[]>(fetchExistingQueryResult[0]);
			const actionHistoryAllEntityList = parseRows<ActionHistoryEntity[]>(fetchExistingQueryResult[1]);
			const actionHistoryEntityList = parseRows<ActionHistoryEntity[]>(fetchExistingQueryResult[2]);
			const itemHistoryEntityList = parseRows<ItemHistoryEntity[]>(fetchExistingQueryResult[3]);
			const inventoryItemEntity = (Array.isArray(inventoryItemEntityList) && inventoryItemEntityList.length > 0) ? inventoryItemEntityList[0] : null;
			if (inventoryItemEntity) assert(inventoryItemRepository.validateInventoryItemEntity(inventoryItemEntity));
			const actionHistoryAllEntity = (Array.isArray(actionHistoryAllEntityList) && actionHistoryAllEntityList.length > 0) ? actionHistoryAllEntityList[0] : null;
			if (actionHistoryAllEntity) assert(actionHistoryRepository.validateActionHistoryEntity(actionHistoryAllEntity));
			const actionHistoryEntity = (Array.isArray(actionHistoryEntityList) && actionHistoryEntityList.length > 0) ? actionHistoryEntityList[0] : null;
			if (actionHistoryEntity) assert(actionHistoryRepository.validateActionHistoryEntity(actionHistoryEntity));
			const itemHistoryEntity = (Array.isArray(itemHistoryEntityList) && itemHistoryEntityList.length > 0) ? itemHistoryEntityList[0] : null;
			if (itemHistoryEntity) assert(itemHistoryRepository.validateItemHistoryEntity(itemHistoryEntity));

			const insert_payload: any =  {
				"queries": []
			}
			

			//Only if the all action history does not exist
			if (!actionHistoryAllEntity) {
				insert_payload.queries.push({
							"tableName": "action_histories",
							"columnsToWrite": [
							  "owner",
							  "identifier",
							  "quantity"
							],
							"values": [
							  [
								userId,
								harvestAllHistory.getIdentifier(),
								possibleHarvests
							  ]
							],
							"conflictColumns": [
							  "owner",
							  "identifier"
							],
							"returnColumns": [
							  "id",
							  "owner",
							  "identifier",
							  "quantity"
							]
						  });
			}

			//Only if the category action history does not exist
			if (!actionHistoryEntity) {
				insert_payload.queries.push({
							"tableName": "action_histories",
							"columnsToWrite": [
							  "owner",
							  "identifier",
							  "quantity"
							],
							"values": [
							  [
								userId,
								harvestCategoryHistory.getIdentifier(),
								possibleHarvests
							  ]
							],
							"conflictColumns": [
							  "owner",
							  "identifier"
							],
							"returnColumns": [
							  "id",
							  "owner",
							  "identifier",
							  "quantity"
							]
						  });
			}

			//Only if the item history does not exist
			if (!itemHistoryEntity) {
				insert_payload.queries.push({
							"tableName": "item_histories",
							"columnsToWrite": [
							  "owner",
							  "identifier",
							  "quantity"
							],
							"values": [
							  [
								userId,
								harvestedItemTemplate.id,
								possibleHarvests
							  ]
							],
							"conflictColumns": [
							  "owner",
							  "identifier"
							],
							"returnColumns": [
							  "id",
							  "owner",
							  "identifier",
							  "quantity"
							]
						  });
			}
			//Only if the harvested item does not exist in inventory
			if (!inventoryItemEntity) {
				insert_payload.queries.push({
					"tableName": "inventory_items",
					"columnsToWrite": [
						"owner",
						"identifier",
						"quantity"
					],
					"values": [
						[
							inventoryEntity.id,
							harvestedItemTemplate.id,
							possibleHarvests
						]
					],
					"conflictColumns": [
						"owner",
						"identifier"
					],
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					]
				})
			}

			let returnItemEntity: InventoryItemEntity;
			if (insert_payload.queries.length > 0) {
				const insertResult = await invokeLambda('garden-insert', insert_payload);
				if (!insertResult) {
					throw new Error(`Failed to insert from lambda`);
				}

				if (!inventoryItemEntity) {
					returnItemEntity = (parseRows<InventoryItemEntity[]>(insertResult[insertResult.length - 1]))[0];
				}
			}

			const update_payload: any = {
				"queries": []
			};

			update_payload.queries.push({
				"tableName": "levels",
				"values": {
					"total_xp": {
						"operator": "+",
						"value": plantItemTemplate.baseExp * possibleHarvests
					}
				},
				"returnColumns": [
					"id"
				],
				"conditions": {
					"id": {
						"operator": "=",
						"value": levelSystemEntity.id
					},
					"owner_uid": {
						"operator": "=",
						"value": userId
					},
					"owner_type": {
						"operator": "=",
						"value": "user"
					}
				}
			});

			if (replaceItemFlag) {
				update_payload.queries.push({
					"tableName": "plots",
					"values": {
						"plant_time": currentTime,
						"uses_remaining": replacementItem.usesRemaining
					},
					"returnColumns": [
						"id"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": plotId
						},
						"owner": {
							"operator": "=",
							"value": gardenId
						}
					}
				});
				update_payload.queries.push({
					"tableName": "placed_items",
					"values": {
						"identifier": replacementItem.identifier,
						"status": replacementItem.status
					},
					"returnColumns": [
						"id"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": placedItemEntity.id
						},
						"owner": {
							"operator": "=",
							"value": plotEntity.id
						}
					}
				});
			} else {
				update_payload.queries.push({
					"tableName": "plots",
					"values": {
						"plant_time": currentTime,
						"uses_remaining": {
							"operator": "-",
							"value": possibleHarvests
						},
						"random_seed": Plot.getNextRandomSeed(Plot.getNextRandomSeed(plotEntity.random_seed))
					},
					"returnColumns": [
						"id"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": plotId
						},
						"owner": {
							"operator": "=",
							"value": gardenId
						}
					}
				});
			}

			

			if (actionHistoryAllEntity) {
				update_payload.queries.push({
					"tableName": "action_histories",
					"values": {
						"quantity": {
							"operator": "+",
							"value": possibleHarvests
						  }
					},
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": actionHistoryAllEntity.id
						},
						"owner": {
							"operator": "=",
							"value": userId
						},
						"identifier": {
							"operator": "=",
							"value": actionHistoryAllEntity.identifier
						}
					}
				})
			}

			if (actionHistoryEntity) {
				update_payload.queries.push({
					"tableName": "action_histories",
					"values": {
						"quantity": {
							"operator": "+",
							"value": possibleHarvests
						  }
					},
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": actionHistoryEntity.id
						},
						"owner": {
							"operator": "=",
							"value": userId
						},
						"identifier": {
							"operator": "=",
							"value": actionHistoryEntity.identifier
						}
					}
				})
			}

			if (itemHistoryEntity) {
				update_payload.queries.push({
					"tableName": "item_histories",
					"values": {
						"quantity": {
							"operator": "+",
							"value": possibleHarvests
						  }
					},
					"returnColumns": [
						"id",
						"owner",
						"identifier",
						"quantity"
					],
					"conditions": {
						"id": {
							"operator": "=",
							"value": itemHistoryEntity.id
						},
						"owner": {
							"operator": "=",
							"value": userId
						},
						"identifier": {
							"operator": "=",
							"value": itemHistoryEntity.identifier
						}
					}
				})
			}

			if (inventoryItemEntity) {
				update_payload.queries.push(
					{
						"tableName": "inventory_items",
						"values": {
							"quantity": {
								"operator": "+",
								"value": possibleHarvests
							}
						},
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"quantity"
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
					})
			}
			

			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Failed to update from lambda`);
			}
			if (inventoryItemEntity) {
				returnItemEntity = (parseRows<InventoryItemEntity[]>(updateQueryResult[updateQueryResult.length - 1]))[0];
			}
			assert(inventoryItemRepository.validateInventoryItemEntity(returnItemEntity!));
			return returnItemEntity!;
		} catch (error) {
			console.error('Error planting seed from Lambda:', error);
			throw error;
		}
	} else {

		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {
			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId),
				plotRepository.getPlotById(plotId),
				inventoryRepository.getInventoryById(inventoryId),
				levelRepository.getLevelSystemById(levelSystemId),
				placedItemRepository.getPlacedItemByPlotId(plotId)
			]);

			// Destructure the results for easier access
			const [gardenResult, plotResult, inventoryResult, levelSystemResult, placedItemResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (plotResult.status === 'rejected' || plotResult.value === null) {
				throw new Error(`Could not find plot matching id ${plotId}`);
			}
			if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
				throw new Error(`Could not find inventory matching id ${inventoryId}`);
			}
			if (levelSystemResult.status === 'rejected' || levelSystemResult.value === null) {
				throw new Error(`Could not find levelsystem matching user id ${levelSystemId}`);
			}
			if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
				throw new Error(`Could not find placedItem matching plot id ${plotId}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;
			const plotEntity = plotResult.value;
			const inventoryEntity = inventoryResult.value;
			const levelSystemEntity = levelSystemResult.value;
			const placedItemEntity = placedItemResult.value;
			

			const {plantItemTemplate, harvestedItemTemplate} = validateCanHarvestPlant(inventoryEntity, placedItemEntity, plotEntity, gardenEntity, levelSystemEntity);

			//harvest is OK

			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}

			//plot details are updated
			const possibleHarvests = Math.min(numHarvests, plotEntity.uses_remaining);
			if (plotEntity.uses_remaining - possibleHarvests <= 0) {
				//replace item
				await plotRepository.setPlotDetails(plotId, currentTime, 0, client);
				await placedItemRepository.replacePlacedItemByPlotId(plotId, replacementItem.identifier, replacementItem.status, client);
			} else {
				await plotRepository.setPlotDetails(plotId, currentTime, plotEntity.uses_remaining - possibleHarvests, client);
			}
			// We check 2 numbers during harvest shiny, so we update twice
			await plotRepository.updatePlotSeed(plotId, 2, client);

			//levelsystem gains xp
			await levelRepository.gainExp(levelSystemId, plantItemTemplate.baseExp, client);

			//inventory item is added
			//TODO: Fix inefficiency
			//We recreate the item first because we don't have a function that directly takes in the itemEntity

			const harvestedItem = new HarvestedItem(uuidv4(), harvestedItemTemplate, possibleHarvests);
			const result = await inventoryItemRepository.addInventoryItem(inventoryId, harvestedItem, client);
			if (!result) {
				throw new Error(`Could not add harvested item ${harvestedItem.getInventoryItemId()} to inventory`);
			}

			//histories are updated
			//action histories
			//plant: all		
			//plant: category
			const harvestAllHistory = actionHistoryFactory.createActionHistoryByIdentifiers(plantItemTemplate.subtype, 'all', 'harvested', 1);
			if (!harvestAllHistory) throw new Error(`Could not create action history from identifier category all`);
			const harvestCategoryHistory = actionHistoryFactory.createActionHistoryByIdentifiers(plantItemTemplate.subtype, plantItemTemplate.category, 'harvested', 1);
			if (!harvestCategoryHistory) throw new Error(`Could not create action history from identifier category ${plantItemTemplate.category}`);
			
			await actionHistoryRepository.addActionHistory(userId, harvestAllHistory, client);
			
			await actionHistoryRepository.addActionHistory(userId, harvestCategoryHistory, client);
		
			//specific item history
			const itemHistory = new ItemHistory(uuidv4(), plantItemTemplate, 1);
			await itemHistoryRepository.addItemHistory(userId, itemHistory, client);	
			
			//Needs to return the created histories as well (?)
			//Or we need to hack it so we can update with anything and fetch correct later
			return result;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'HarvestPlant', client);
	}
}


/**
 * Attempts to pickup a decoration, removing the item from it and adding it to the inventory.
 * @gardenId the garden containing this plot
 * @plotId the plot to remove the item from
 * @inventoryId the inventory to add the blueprint item to
 * @userId the user to verify with, and update histories for
 * @replacementItem a placedItemDetailsEntity to replace the plot, defaults to ground
 * @client if null, creates a new client
 * @returns an object containing the blueprint item on success (or throws error)
 */
export async function pickupDecoration(gardenId: string, plotId: string, inventoryId: string, userId: string, replacementItem?: PlacedItemDetailsEntity, client?: PoolClient): Promise<InventoryItemEntity> {
	//Can put validation/business logic here
	//We always check based on current time
	const currentTime = Date.now();

	function validateCanPickupDecoration(inventoryEntity: InventoryEntity, placedItemEntity: PlacedItemEntity, plotEntity: PlotEntity, gardenEntity: GardenEntity): {blueprintItemTemplate: BlueprintTemplate, decorationItemTemplate: DecorationTemplate} {
		const plotItemTemplate = placeholderItemTemplates.getPlacedTemplate(placedItemEntity.identifier);
		if (!plotItemTemplate || plotItemTemplate.subtype !== ItemSubtypes.DECORATION.name) {
			throw new Error(`Could not find valid decoration matching identifier ${placedItemEntity.identifier}`);
		}

		const blueprintItemTemplate = placeholderItemTemplates.getInventoryTemplate(plotItemTemplate.transformId);
		if (!blueprintItemTemplate || blueprintItemTemplate.subtype !== ItemSubtypes.BLUEPRINT.name) {
			throw new Error(`Could not find valid blueprint matching identifier ${plotItemTemplate.transformId}`);
		}

		assert('transformId' in blueprintItemTemplate);
		
		//Check if placement is valid

		if (inventoryEntity.owner !== userId) {
			throw new Error(`Inventory ${inventoryEntity.id} is not owned by user ${userId}`);
		}

		if (placedItemEntity.owner !== plotEntity.id) {
			throw new Error(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
		}

		if (plotEntity.owner !== gardenEntity.id) {
			throw new Error(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			throw new Error(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
		}

		//Decorations have the same parameters as placedItems, so we only have to check the subtype field

		return {blueprintItemTemplate: blueprintItemTemplate, decorationItemTemplate: plotItemTemplate};
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			// 'SELECT id, owner, rows, columns FROM gardens WHERE id = $1 and owner = $2'
			// 'SELECT id, owner, row_index, col_index, plant_time, uses_remaining, random_seed FROM plots WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, gold FROM inventories WHERE id = $1 AND owner = $2'
			// 'SELECT id, owner, identifier, quantity FROM inventory_items WHERE owner = $1 AND identifier = $2'
			// 'SELECT id, owner, identifier, status FROM placed_items WHERE owner = $1'
			const fetch_payload = {
				"queries": [
					{
						"tableName": "gardens",
						"returnColumns": [
							"id", 
							"owner", 
							"rows", 
							"columns"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
							},
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1
					},
					{
						"tableName": "plots",
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
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
						"tableName": "placed_items",
						"returnColumns": [
							"id", 
							"owner", 
							"identifier",
							"status"
						],
						"conditions": {
							"owner": {
								"operator": "=",
								"value": plotId
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

			const gardenEntity = parseRows<GardenEntity[]>(fetchQueryResult[0])[0];
			assert(gardenRepository.validateGardenEntity(gardenEntity));
			const plotEntity = parseRows<PlotEntity[]>(fetchQueryResult[1])[0];
			assert(plotRepository.validatePlotEntity(plotEntity));
			const inventoryEntity = parseRows<InventoryEntity[]>(fetchQueryResult[2])[0];
			assert(inventoryRepository.validateInventoryEntity(inventoryEntity));
			const placedItemEntity = parseRows<PlacedItemEntity[]>(fetchQueryResult[3])[0];
			assert(placedItemRepository.validatePlacedItemEntity(placedItemEntity));

			//Check that we can plant seed
			const {blueprintItemTemplate, decorationItemTemplate} = validateCanPickupDecoration(inventoryEntity, placedItemEntity, plotEntity, gardenEntity);

			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}

			let returnItemEntity: InventoryItemEntity;

			const inventoryItem_fetch_payload = {
				"queries": [
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
								"value": blueprintItemTemplate.id
							}
						},
						"limit": 1
					}
				]
			}

			const fetchItemQueryResult = await invokeLambda('garden-select', inventoryItem_fetch_payload);
			if (!fetchItemQueryResult) {
				throw new Error(`Failed to return value from lambda`);
			}
			const inventoryItemEntityList = parseRows<InventoryItemEntity[]>(fetchItemQueryResult[0]);
			const inventoryItemEntity = (Array.isArray(inventoryItemEntityList) && inventoryItemEntityList.length > 0) ? inventoryItemEntityList[0] : null;
			if (inventoryItemEntity) assert(inventoryItemRepository.validateInventoryItemEntity(inventoryItemEntity));
			//Only if the inventoryItem does not exist
			if (!inventoryItemEntity) {
				const insert_payload = {
					"queries": [
						{
							"tableName": "inventory_items",
							"columnsToWrite": [
								"owner",
								"identifier",
								"quantity"
							],
							"values": [
								[
									inventoryEntity.id,
									blueprintItemTemplate.id,
									1
								]
							],
							"conflictColumns": [
								"owner",
								"identifier"
							],
							"returnColumns": [
								"id",
								"owner",
								"identifier",
								"quantity"
							]
						}
					]
				};
				const insertInventoryItemResult = await invokeLambda('garden-insert', insert_payload);

				returnItemEntity = parseRows(insertInventoryItemResult[0])[0];
			}

			// 'UPDATE plots SET plant_time = $1, uses_remaining = $2 WHERE id = $3 AND owner = $4'
			const update_payload: any = {
				"queries": [
					{
						"tableName": "plots",
						"values": {
							"plant_time": currentTime,
							"uses_remaining": replacementItem.usesRemaining
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
							}
						}
					},
					{
						"tableName": "placed_items",
						"values": {
							"identifier": replacementItem.identifier,
							"status": replacementItem.status
						},
						"returnColumns": [
							"id"
						],
						"conditions": {
							"id": {
								"operator": "=",
								"value": placedItemEntity.id
							},
							"owner": {
								"operator": "=",
								"value": plotEntity.id
							}
						}
					}
				]
			  }

			if (inventoryItemEntity) {
				update_payload.queries.push(
					{
						"tableName": "inventory_items",
						"values": {
							"quantity": {
								"operator": "+",
								"value": 1
							}
						},
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"quantity"
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
					})
			}

			const updateQueryResult = await invokeLambda('garden-update', update_payload);
			if (!updateQueryResult) {
				throw new Error(`Failed to update from lambda`);
			}
			if (inventoryItemEntity) {
				returnItemEntity = parseRows(updateQueryResult[2])[0];
			}
			return returnItemEntity!;
		} catch (error) {
			console.error('Error picking up decoration from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient): Promise<InventoryItemEntity> => {

			// Grab all relevant objects concurrently
			const results = await Promise.allSettled([
				gardenRepository.getGardenById(gardenId),
				plotRepository.getPlotById(plotId),
				placedItemRepository.getPlacedItemByPlotId(plotId),
				inventoryRepository.getInventoryById(inventoryId)
			]);

			// Destructure the results for easier access
			const [gardenResult, plotResult, placedItemResult, inventoryResult] = results;

			// Check for errors in each promise and handle accordingly
			if (gardenResult.status === 'rejected' || gardenResult.value === null) {
				throw new Error(`Could not find garden matching id ${gardenId}`);
			}
			if (plotResult.status === 'rejected' || plotResult.value === null) {
				throw new Error(`Could not find plot matching id ${plotId}`);
			}
			if (inventoryResult.status === 'rejected' || inventoryResult.value === null) {
				throw new Error(`Could not find inventory matching id ${inventoryId}`);
			}
			if (placedItemResult.status === 'rejected' || placedItemResult.value === null) {
				throw new Error(`Could not find placedItem matching plot id ${plotId}`);
			}

			// Extract the resolved values
			const gardenEntity = gardenResult.value;
			const plotEntity = plotResult.value;
			const inventoryEntity = inventoryResult.value;
			const placedItemEntity = placedItemResult.value;
			
			//Check if pickup is valid
			const {blueprintItemTemplate, decorationItemTemplate} = validateCanPickupDecoration(inventoryEntity, placedItemEntity, plotEntity, gardenEntity);


			//pickup is OK
			if (!replacementItem) {
				replacementItem = {
					identifier: '0-00-00-00-00', //hardcoded ground id
					status: '',
					usesRemaining: 0
				}
			}

			//plot details are updated
			await plotRepository.setPlotDetails(plotId, currentTime, replacementItem.usesRemaining, client);
			await placedItemRepository.replacePlacedItemByPlotId(plotId, replacementItem.identifier, replacementItem.status, client);

			//inventory item is added
			//TODO: Fix inefficiency
			//We recreate the item first because we don't have a function that directly takes in the itemEntity
			
			const blueprintItem = new Blueprint(uuidv4(), blueprintItemTemplate as BlueprintTemplate, 1);
			const result = await inventoryItemRepository.addInventoryItem(inventoryId, blueprintItem, client);
			
			if (!result) {
				throw new Error(`Could not add blueprint item ${blueprintItem.getInventoryItemId()} to inventory`);
			}
			return result;
		} 

		// Call the transactionWrapper with the innerFunction and appropriate arguments
		return transactionWrapper(innerFunction, 'PickupDecoration', client);
	}
}

/**
 * @returns a plot plain object
 */
 export async function getPlotFromDatabase(plotId: string, gardenId: string, userId: string, client?: PoolClient): Promise<any> {
	function validatePlotData(plotEntity: any, gardenEntity: any, placedItemEntity: any): boolean {
		assert(plotRepository.validatePlotEntity(plotEntity));
		assert(gardenRepository.validateGardenEntity(gardenEntity));
		assert(placedItemRepository.validatePlacedItemEntity(placedItemEntity));

		if (placedItemEntity.owner !== plotEntity.id) {
			throw new Error(`Placed item ${placedItemEntity.id} is not owned by plot ${plotEntity.id}`);
		}

		if (plotEntity.owner !== gardenEntity.id) {
			throw new Error(`Plot ${plotEntity.id} is not owned by garden ${gardenEntity.id}`);
		}

		if (gardenEntity.owner !== userId) {
			throw new Error(`Garden ${gardenEntity.id} is not owned by user ${userId}`);
		}

		if (plotEntity.row_index >= gardenEntity.rows || plotEntity.col_index >= gardenEntity.columns) {
			throw new Error(`Plot ${plotEntity.id} is not within bounds of garden ${gardenId}`);
		}

		return true;
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {

			const payload = {
				"queries": [
					{
						"returnColumns": [
							"id", 
							"owner", 
							"row_index", 
							"col_index", 
							"plant_time", 
							"uses_remaining", 
							"random_seed"
						],
						"tableName": "plots",
						"conditions": {
							"id": {
							"operator": "=",
							"value": plotId
							},
							"owner": {
								"operator": "=",
								"value": gardenId
								}
						},
						"limit": 1
					},
					{
						"returnColumns": [
							"id",
							"owner",
							"rows",
							"columns"
						],
						"tableName": "gardens",
						"conditions": {
							"id": {
								"operator": "=",
								"value": gardenId
								},
							"owner": {
								"operator": "=",
								"value": userId
								}
						},
						"limit": 1
					},
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"status"
						],
						"tableName": "placed_items",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": plotId
								}
						},
						"limit": 1
					}
				]
			  }
			const queryResult = await invokeLambda('garden-select', payload);
			const plotEntity = parseRows<PlotEntity[]>(queryResult[0])[0];
			const gardenEntity = parseRows<GardenEntity[]>(queryResult[1])[0];
			const placedItemEntity = parseRows<PlacedItemEntity[]>(queryResult[2])[0];
			assert(validatePlotData(plotEntity, gardenEntity, placedItemEntity));

			const placedItemInstance = placedItemRepository.makePlacedItemObject(placedItemEntity);
			const plotInstance = plotRepository.makePlotObject(plotEntity, placedItemInstance);
			return plotInstance.toPlainObject();
		} catch (error) {
			console.error('Error fetching plot from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {

			const plotEntity = await plotRepository.getPlotById(plotId);
			const gardenEntity = await gardenRepository.getGardenById(gardenId);
			const placedItemEntity = await placedItemRepository.getPlacedItemByPlotId(plotId);

			assert(validatePlotData(plotEntity, gardenEntity, placedItemEntity));

			const placedItemInstance = await plotRepository.getPlacedItem(plotEntity!.id);
			const plotInstance = plotRepository.makePlotObject(plotEntity!, placedItemInstance);
			return plotInstance.toPlainObject();
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchInventoryFromDatabase', client);
	}
}