
import { PlantTemplate } from "../templates/models/PlantTemplate";
import { PlacedItem } from "./PlacedItem";
import { v4 as uuidv4 } from 'uuid';

export class Plant extends PlacedItem{
	itemData: PlantTemplate;
	constructor(placedItemId: string, itemData: PlantTemplate, status: string) {
		super(placedItemId, itemData, status);
		this.itemData = itemData;
	}
	
	static fromPlainObject(plainObject: any): Plant {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData) {
                throw new Error('Invalid plainObject structure for Plant');
            }
			// Validate required properties
			const { placedItemId, itemData, status } = plainObject;

			if (!itemData || typeof status !== 'string' || typeof placedItemId !== 'string') {
				throw new Error('Invalid properties in plainObject for Plant');
			}
	
			// Validate itemData structure
			const validatedItemData = PlantTemplate.fromPlainObject(itemData);
	
			return new Plant(placedItemId, validatedItemData, status);
		} catch (err) {
			console.error('Error creating PlantItem from plainObject:', err);
            return new Plant(uuidv4(), PlantTemplate.getErrorTemplate(), 'error');
		}
	}

	toPlainObject(): any {
		return {
			placedItemId: this.placedItemId,
			status: this.status,
			itemData: this.itemData.toPlainObject()
		}
	} 
}