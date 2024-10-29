
import { EmptyItemTemplate } from "../templates/models/EmptyItemTemplate";
import { PlacedItem } from "./PlacedItem";
import { v4 as uuidv4 } from 'uuid';

export class EmptyItem extends PlacedItem{
	itemData: EmptyItemTemplate;
	constructor(placedItemId: string, itemData: EmptyItemTemplate, status: string) {
		super(placedItemId, itemData, status);
		this.itemData = itemData;
	}

	static fromPlainObject(plainObject: any): EmptyItem {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData) {
                throw new Error('Invalid plainObject structure for EmptyItem');
            }
			// Validate required properties
			const { placedItemId, itemData, status } = plainObject;

			if (!itemData || typeof status !== 'string' || typeof placedItemId !== 'string') {
				throw new Error('Invalid properties in plainObject for EmptyItem');
			}
	
			// Validate itemData structure
			const validatedItemData = EmptyItemTemplate.fromPlainObject(itemData);
	
			return new EmptyItem(placedItemId, validatedItemData, status);
		} catch (err) {
			console.error('Error creating EmptyItem from plainObject:', err);
            return new EmptyItem(uuidv4(), EmptyItemTemplate.getErrorTemplate(), 'error');
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