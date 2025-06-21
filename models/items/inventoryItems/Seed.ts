import { SeedTemplate } from "../templates/models/InventoryItemTemplates/SeedTemplate";
import { InventoryItem } from "./InventoryItem";
import { v4 as uuidv4 } from 'uuid';

export class Seed extends InventoryItem {
	itemData: SeedTemplate;

	constructor(inventoryItemId: string, itemData: SeedTemplate, quantity: number) {
		super(inventoryItemId, itemData, quantity);
		this.itemData = itemData;
	}


	static fromPlainObject(plainObject: any): Seed {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || (plainObject.quantity == null)) {
				throw new Error('Invalid plainObject structure for SeedItem');
            }
			// Validate required properties
			const { inventoryItemId, itemData, quantity } = plainObject;

			if (!itemData || typeof quantity !== 'number' || typeof inventoryItemId !== 'string') {
				throw new Error('Invalid properties in plainObject for SeedItem');
			}
	
			// Validate itemData structure
			const validatedItemData = SeedTemplate.fromPlainObject(itemData);
	
			return new Seed(inventoryItemId, validatedItemData, quantity);
		} catch (err) {
			console.error('Error creating SeedItem from plainObject:', err);
            return new Seed(uuidv4(), SeedTemplate.getErrorTemplate(), 1);
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