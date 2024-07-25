import { InventoryTransactionResponse } from "@/models/itemStore/inventory/InventoryTransactionResponse";
import { Item } from "../Item";
import { ItemTemplate, PlaceholderItemTemplates } from "../ItemTemplate";
import { ItemSubtypes} from "../ItemTypes";
import { generateNewPlaceholderInventoryItem } from "../PlaceholderItems";

export class InventoryItem extends Item {
	private quantity: number;
	
	constructor(itemData: ItemTemplate, quantity: number) {
		super(itemData);
		this.quantity = quantity;
	}

	static fromPlainObject(plainObject: any): InventoryItem {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || !plainObject.quantity) {
                throw new Error('Invalid plainObject structure for InventoryItem');
            }
			// Validate required properties
			const { itemData, quantity } = plainObject;

			if (!itemData || typeof quantity !== 'number') {
				throw new Error('Invalid properties in plainObject for InventoryItem');
			}
	
			// Validate itemData structure
			const validatedItemData = ItemTemplate.fromPlainObject(itemData);
	
			return new InventoryItem(validatedItemData, quantity);
		} catch (err) {
			console.error('Error creating InventoryItem from plainObject:', err);
            return new InventoryItem(PlaceholderItemTemplates.PlaceHolderItems.errorInventoryItem, 1);
		}
	}

	toPlainObject(): any {
		return {
			quantity: this.quantity,
			itemData: this.itemData.toPlainObject()
		}
	} 
	
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
			case ItemSubtypes.SEED.name:
				response.payload = {
					originalItem: this,
					newTemplate: PlaceholderItemTemplates.getTransformTemplate(this.itemData.transformId),
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