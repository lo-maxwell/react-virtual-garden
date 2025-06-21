

import { InventoryItem } from "./InventoryItem";
import { v4 as uuidv4 } from 'uuid';
import { HarvestedItemTemplate } from "../templates/models/InventoryItemTemplates/HarvestedItemTemplate";

export class HarvestedItem extends InventoryItem {
	itemData: HarvestedItemTemplate;

	constructor(inventoryItemId: string, itemData: HarvestedItemTemplate, quantity: number) {
		super(inventoryItemId, itemData, quantity);
		this.itemData = itemData;
	}


	static fromPlainObject(plainObject: any): HarvestedItem {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || (plainObject.quantity == null)) {
                throw new Error('Invalid plainObject structure for HarvestedItem');
            }
			// Validate required properties
			const { inventoryItemId, itemData, quantity } = plainObject;

			if (!itemData || typeof quantity !== 'number' || typeof inventoryItemId !== 'string') {
				throw new Error('Invalid properties in plainObject for HarvestedItem');
			}
	
			// Validate itemData structure
			const validatedItemData = HarvestedItemTemplate.fromPlainObject(itemData);
	
			return new HarvestedItem(inventoryItemId, validatedItemData, quantity);
		} catch (err) {
			console.error('Error creating HarvestedItem from plainObject:', err);
            return new HarvestedItem(uuidv4(), HarvestedItemTemplate.getErrorTemplate(), 1);
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