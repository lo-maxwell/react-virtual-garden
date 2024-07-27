import { BlueprintTemplate } from "../templates/BlueprintTemplate";
import { InventoryItemTemplate } from "../templates/InventoryItemTemplate";
import { ItemTemplate } from "../templates/ItemTemplate";
import { InventoryItem } from "./InventoryItem";

export class Blueprint extends InventoryItem {
	constructor(itemData: BlueprintTemplate, quantity: number) {
		super(itemData, quantity);
	}

	static fromPlainObject(plainObject: any): Blueprint {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || !plainObject.quantity) {
                throw new Error('Invalid plainObject structure for BlueprintItem');
            }
			// Validate required properties
			const { itemData, quantity } = plainObject;

			if (!itemData || typeof quantity !== 'number') {
				throw new Error('Invalid properties in plainObject for BlueprintItem');
			}
	
			// Validate itemData structure
			const validatedItemData = BlueprintTemplate.fromPlainObject(itemData);
	
			return new Blueprint(validatedItemData, quantity);
		} catch (err) {
			console.error('Error creating BlueprintItem from plainObject:', err);
            return new Blueprint(BlueprintTemplate.getErrorTemplate(), 1);
		}
	}

	toPlainObject(): any {
		return {
			quantity: this.quantity,
			itemData: this.itemData.toPlainObject()
		}
	} 
}