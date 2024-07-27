import { InventoryTransactionResponse } from "@/models/itemStore/inventory/InventoryTransactionResponse";
import { Item } from "../Item";
import { ItemSubtypes} from "../ItemTypes";
import { generateNewPlaceholderInventoryItem } from "../PlaceholderItems";
import { BlueprintTemplate } from "../templates/BlueprintTemplate";
import { InventoryItemTemplate } from "../templates/InventoryItemTemplate";
import { ItemTemplate } from "../templates/ItemTemplate";
import PlaceholderItemTemplates from "../templates/PlaceholderItemTemplate";
import { SeedTemplate } from "../templates/SeedTemplate";

export abstract class InventoryItem extends Item {
	itemData: InventoryItemTemplate;
	protected quantity: number;
	
	constructor(itemData: InventoryItemTemplate, quantity: number) {
		super();
		this.itemData = itemData;
		this.quantity = quantity;
	}

	// static fromPlainObject(plainObject: any): InventoryItem {
	// 	try {
    //         // Validate plainObject structure
    //         if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || !plainObject.quantity) {
    //             throw new Error('Invalid plainObject structure for InventoryItem');
    //         }
	// 		// Validate required properties
	// 		const { itemData, quantity } = plainObject;

	// 		if (!itemData || typeof quantity !== 'number') {
	// 			throw new Error('Invalid properties in plainObject for InventoryItem');
	// 		}
	
	// 		// Validate itemData structure
	// 		const validatedItemData = InventoryItemTemplate.fromPlainObject(itemData);
	
	// 		return new InventoryItem(validatedItemData, quantity);
	// 	} catch (err) {
	// 		console.error('Error creating InventoryItem from plainObject:', err);
    //         return new InventoryItem(InventoryItemTemplate.getErrorTemplate(), 1);
	// 	}
	// }

	static fromPlainObject(plainObject: any): InventoryItem {
        throw new Error("fromPlainObject must be implemented in subclasses");
    }

	abstract toPlainObject(): any;
	// {
	// 	return {
	// 		quantity: this.quantity,
	// 		itemData: this.itemData.toPlainObject()
	// 	}
	// } 
	
	/**
	 * @returns the quantity
	 */
	getQuantity(): number {
		return this.quantity;
	}

	/** 
	 * Replaces the existing quantity
	 * @param quantity the new quantity
	 */
	setQuantity(quantity: number): void {
		this.quantity = quantity;
	}

	/**
	 * Consumes x quantity from the specified item.
	 * Performs a specific action depending on the item type:
	 * Blueprint -> returns the Decoration ItemTemplate corresponding to the Blueprint
	 * Seed -> returns the Plant ItemTemplate corresponding to the Seed
	 * HarvestedItem -> error
	 * Fails if there is not enough quantity of item
	 * @param quantity the number of item used
	 * @returns a response containing the following object, or an error message
	 * {originalItem: InventoryItem
	 *  newTemplate: ItemTemplate}
	 */
	use(quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (this.getQuantity() < quantity) {
			response.addErrorMessage(`item lacks the required quantity to use, needs ${quantity} and has ${this.getQuantity()}`);
			return response;
		}
		switch(this.itemData.subtype) {
			case ItemSubtypes.BLUEPRINT.name:
				//TODO: Replace type assertion with guard
				const blueprintData = this.itemData as BlueprintTemplate;
				response.payload = {
					originalItem: this,
					newTemplate: PlaceholderItemTemplates.getPlacedTransformTemplate(blueprintData.transformId),
				};
				this.setQuantity(this.getQuantity() - quantity);
				break;
			case ItemSubtypes.SEED.name:
				const seedData = this.itemData as SeedTemplate;
				response.payload = {
					originalItem: this,
					newTemplate: PlaceholderItemTemplates.getPlacedTransformTemplate(seedData.transformId),
				};
				this.setQuantity(this.getQuantity() - quantity);
				break;
			default:
				response.addErrorMessage(`item is of type ${this.itemData.subtype}, cannot be used`);
				break;
		}
		return response;
	}
}