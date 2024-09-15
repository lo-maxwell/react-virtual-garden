import { BlueprintTemplate } from "../templates/models/BlueprintTemplate";
import { InventoryItem } from "./InventoryItem";
import { v4 as uuidv4 } from 'uuid';

export class Blueprint extends InventoryItem {
	itemData: BlueprintTemplate;

	constructor(inventoryItemId: string, itemData: BlueprintTemplate, quantity: number) {
		super(inventoryItemId, itemData, quantity);
		this.itemData = itemData;
	}

	static fromPlainObject(plainObject: any): Blueprint {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || (plainObject.quantity == null)) {
                throw new Error('Invalid plainObject structure for BlueprintItem');
            }
			// Validate required properties
			const {inventoryItemId, itemData, quantity } = plainObject;

			if (!itemData || typeof quantity !== 'number' || typeof inventoryItemId !== 'string') {
				throw new Error('Invalid properties in plainObject for BlueprintItem');
			}
	
			// Validate itemData structure
			const validatedItemData = BlueprintTemplate.fromPlainObject(itemData);
	
			return new Blueprint(inventoryItemId, validatedItemData, quantity);
		} catch (err) {
			console.error('Error creating BlueprintItem from plainObject:', err);
            return new Blueprint(uuidv4(), BlueprintTemplate.getErrorTemplate(), 1);
		}
	}

	toPlainObject(): any {
		return {
			inventoryItemId: this.inventoryItemId,
			quantity: this.quantity,
			itemData: this.itemData.toPlainObject()
		}
	} 
}