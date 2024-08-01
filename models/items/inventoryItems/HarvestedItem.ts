import { HarvestedItemTemplate } from "../templates/HarvestedItemTemplate";
import { InventoryItemTemplate } from "../templates/InventoryItemTemplate";
import { ItemTemplate } from "../templates/ItemTemplate";
import { InventoryItem } from "./InventoryItem";

export class HarvestedItem extends InventoryItem {
	itemData: HarvestedItemTemplate;

	constructor(itemData: HarvestedItemTemplate, quantity: number) {
		super(itemData, quantity);
		this.itemData = itemData;
	}


	static fromPlainObject(plainObject: any): HarvestedItem {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData || !plainObject.quantity) {
                throw new Error('Invalid plainObject structure for HarvestedItem');
            }
			// Validate required properties
			const { itemData, quantity } = plainObject;

			if (!itemData || typeof quantity !== 'number') {
				throw new Error('Invalid properties in plainObject for HarvestedItem');
			}
	
			// Validate itemData structure
			const validatedItemData = HarvestedItemTemplate.fromPlainObject(itemData);
	
			return new HarvestedItem(validatedItemData, quantity);
		} catch (err) {
			console.error('Error creating HarvestedItem from plainObject:', err);
            return new HarvestedItem(HarvestedItemTemplate.getErrorTemplate(), 1);
		}
	}

	toPlainObject(): any {
		return {
			quantity: this.quantity,
			itemData: this.itemData.toPlainObject()
		}
	} 
}