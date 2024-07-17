import { Inventory } from "../inventory/Inventory";
import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { PlaceholderItemTemplates } from "../items/ItemTemplate";
import { ItemSubtypes, ItemTypes } from "../items/ItemTypes";
import { EmptyItem } from "../items/placedItems/EmptyItem";
import { PlacedItem } from "../items/placedItems/PlacedItem";
import { generateNewPlaceholderPlacedItem } from "../items/PlaceholderItems";
import { GardenTransactionResponse } from "./GardenTransactionResponse";

export class Plot {
	
	
	private item: PlacedItem;

	constructor(item: PlacedItem) {
		this.item = item;
	}

	static fromPlainObject(plainObject: any): Plot {
		const item = PlacedItem.fromPlainObject(plainObject.item);
    	return new Plot(item);
	}

	/**
	 * @returns a copy of this plot.
	 */
	clone() {
		return new Plot(this.item);
	}

	/**
	 * @returns a copy of the item contained by this plot
	 */
	getItem(): PlacedItem {
		return new PlacedItem(this.item.itemData, this.item.getStatus());
	}

	/** 
	 * Replaces the existing item with a new one.
	 * @param item the item to replace with
	 * @returns the changed item.
	 */
	setItem(item: PlacedItem): PlacedItem {
		this.item = item;
		return this.item;
	}

	/**
	 * @returns the subtype of the item contained in this plot
	 */
	 getItemSubtype(): string {
		return this.item.itemData.subtype;
	}

	/**
	 * @returns the status
	 */
	 getItemStatus(): string {
		return this.item.getStatus();
	}

	/** Replaces the existing status
	 * @status the new status
	 */
	setItemStatus(status: string): void {
		this.item.setStatus(status);
	}

	/**
	 * Removes the item from this plot and replaces it with the specified item. Removes status messages.
	 * Performs a specific action depending on the item type:
	 * Decoration -> returns the Blueprint ItemTemplate corresponding to the Decoration
	 * Plant -> returns the HarvestedItem ItemTemplate corresponding to the Plant
	 * EmptyItem -> error
	 * @param item the item to replace with. Default: ground
	 * @returns a response containing the following object, or an error message
	 * {originalItem: PlacedItem, 
	 *  replacedItem: PlacedItem, 
	 *  newTemplate: ItemTemplate}
	 */
	useItem(item: PlacedItem = new EmptyItem(PlaceholderItemTemplates.PlaceHolderItems.ground, '')): GardenTransactionResponse {
		const response = new GardenTransactionResponse();
		const originalItem = this.item;
		let useItemResponse: GardenTransactionResponse;
		switch(item.itemData.subtype) {
			case ItemSubtypes.DECORATION.name:
			case ItemSubtypes.PLANT.name:
			case ItemSubtypes.GROUND.name:
				useItemResponse = this.item.use();
				if (!useItemResponse.isSuccessful()) {
					return useItemResponse;
				}
				this.setItem(item);
				break;
			default:
				response.addErrorMessage(`item is of type ${item.itemData.subtype}, cannot replace used item`);
				return response;
		}
		response.payload = {
			originalItem: originalItem,
			replacedItem: this.item,
			newTemplate: useItemResponse!.payload.newTemplate
		}

		return response;
	}

	/**
	 * Converts an inventoryItem into a PlacedItem, removes 1 quantity from it, and adds that item to this plot.
	 * Requires that this plot contains an emptyItem.
	 * Performs a specific action depending on the item type:
	 * Blueprint -> returns a new Decoration corresponding to the blueprint
	 * Seed -> returns a new Plant corresponding to the blueprint
	 * HarvestedItem -> error
	 * @param inventory the inventory to modify
	 * @param item the inventoryItem to convert
	 * @returns a response containing the following object, or an error message
	 *  {
			newItem: PlacedItem
		}
	 */
	placeItem(inventory: Inventory, item: InventoryItem): GardenTransactionResponse {
		const response = new GardenTransactionResponse();
		const originalItem = this.item;
		if (originalItem.itemData.subtype != ItemSubtypes.GROUND.name) {
			response.addErrorMessage(`existing item is of type ${originalItem.itemData.subtype} but should be ground, cannot place here`);
			return response;
		}
		let useItemResponse: GardenTransactionResponse;
		switch(item.itemData.subtype) {
			case ItemSubtypes.SEED.name:
			case ItemSubtypes.BLUEPRINT.name:
				useItemResponse = inventory.useItem(item, 1);
				if (!useItemResponse.isSuccessful()) {
					return useItemResponse;
				}
				const newPlacedItem = new PlacedItem(useItemResponse.payload.newTemplate, "");
				this.setItem(newPlacedItem);
				break;
			default:
				response.addErrorMessage(`item is of type ${item.itemData.subtype}, cannot replace used item`);
				return response;
		}
		response.payload = {
			newItem: this.item
		}
		return response;
	}

	/**
	 * Converts the item in this plot into an InventoryItem, adds 1 quantity of it to inventory, and replaces the existing item in this plot with a new item.
	 * Requires that this plot contains an emptyItem.
	 * Performs a specific action depending on the item type:
	 * Blueprint -> returns a new Decoration corresponding to the blueprint
	 * Seed -> returns a new Plant corresponding to the blueprint
	 * HarvestedItem -> error
	 * @param inventory the inventory to modify
	 * @param updatedItem the item to replace with in this plot, defaults to ground.
	 * @returns a response containing the following object, or an error message
	 *  {
			pickedItem: PlacedItem
			newItem: InventoryItem
		}
	 */
	pickupItem(inventory: Inventory, updatedItem: PlacedItem = generateNewPlaceholderPlacedItem("ground", "")) {
		const response = new GardenTransactionResponse();
		if (updatedItem.itemData.type != ItemTypes.PLACED.name) {
			response.addErrorMessage(`item to replace with is of type ${updatedItem.itemData.type} but should be placedItem, cannot replace`);
			return response;
		}
		const originalItem = this.item;
		let useItemResponse: GardenTransactionResponse;
		switch(originalItem.itemData.subtype) {
			case ItemSubtypes.PLANT.name:
			case ItemSubtypes.DECORATION.name:
				useItemResponse = originalItem.use();
				if (!useItemResponse.isSuccessful()) {
					return useItemResponse;
				}
				inventory.gainItem(useItemResponse.payload.newTemplate, 1);
				this.setItem(updatedItem);
				break;
			default:
				response.addErrorMessage(`item is of type ${originalItem.itemData.subtype}, cannot pickup item`);
				return response;
		}

		let findItemResponse = inventory.getItem(useItemResponse.payload.newTemplate);
		if (!findItemResponse.isSuccessful()) {
			response.addErrorMessage(`error adding item to inventory: ${findItemResponse.messages[0]}`);
			return response;
		}
		response.payload = {
			pickedItem: originalItem,
			newItem: findItemResponse.payload
		}
		return response;
	}
}