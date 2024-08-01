import { ItemTemplate } from "../templates/ItemTemplate";
import { PlacedItemTemplate } from "../templates/PlacedItemTemplate";
import { PlantTemplate } from "../templates/PlantTemplate";
import { PlacedItem } from "./PlacedItem";

export class Plant extends PlacedItem{
	itemData: PlantTemplate;
	constructor(itemData: PlantTemplate, status: string) {
		super(itemData, status);
		this.itemData = itemData;
	}
	
	static fromPlainObject(plainObject: any): Plant {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData) {
                throw new Error('Invalid plainObject structure for Plant');
            }
			// Validate required properties
			const { itemData, status } = plainObject;

			if (!itemData || typeof status !== 'string') {
				throw new Error('Invalid properties in plainObject for Plant');
			}
	
			// Validate itemData structure
			const validatedItemData = PlantTemplate.fromPlainObject(itemData);
	
			return new Plant(validatedItemData, status);
		} catch (err) {
			console.error('Error creating PlantItem from plainObject:', err);
            return new Plant(PlantTemplate.getErrorTemplate(), 'error');
		}
	}

	toPlainObject(): any {
		return {
			status: this.status,
			itemData: this.itemData.toPlainObject()
		}
	} 
}