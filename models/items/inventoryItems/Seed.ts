import { SeedTemplate } from "../templates/models/SeedTemplate";
import { InventoryItem } from "./InventoryItem";

export class Seed extends InventoryItem {
	itemData: SeedTemplate;

	constructor(itemData: SeedTemplate, quantity: number) {
		super(itemData, quantity);
		this.itemData = itemData;
	}


	static fromPlainObject(plainObject: any): Seed {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || !plainObject.quantity) {
                throw new Error('Invalid plainObject structure for SeedItem');
            }
			// Validate required properties
			const { itemData, quantity } = plainObject;

			if (!itemData || typeof quantity !== 'number') {
				throw new Error('Invalid properties in plainObject for SeedItem');
			}
	
			// Validate itemData structure
			const validatedItemData = SeedTemplate.fromPlainObject(itemData);
	
			return new Seed(validatedItemData, quantity);
		} catch (err) {
			console.error('Error creating SeedItem from plainObject:', err);
            return new Seed(SeedTemplate.getErrorTemplate(), 1);
		}
	}

	toPlainObject(): any {
		return {
			quantity: this.quantity,
			itemData: this.itemData.toPlainObject()
		}
	} 
	
}