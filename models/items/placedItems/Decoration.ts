
import { PlacedItem } from "./PlacedItem";
import { v4 as uuidv4 } from 'uuid';
import { DecorationTemplate } from "../templates/models/PlacedItemTemplates/DecorationTemplate";

export class Decoration extends PlacedItem {
	itemData: DecorationTemplate;
	constructor(placedItemId: string, itemData: DecorationTemplate, status: string) {
		super(placedItemId, itemData, status);
		this.itemData = itemData;
	}


	static fromPlainObject(plainObject: any): Decoration {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData) {
                throw new Error('Invalid plainObject structure for DecorationItem');
            }
			// Validate required properties
			const { placedItemId, itemData, status } = plainObject;

			if (!itemData || typeof status !== 'string' || typeof placedItemId !== 'string') {
				throw new Error('Invalid properties in plainObject for DecorationItem');
			}
	
			// Validate itemData structure
			const validatedItemData = DecorationTemplate.fromPlainObject(itemData);
	
			return new Decoration(placedItemId, validatedItemData, status);
		} catch (err) {
			console.error('Error creating DecorationItem from plainObject:', err);
            return new Decoration(uuidv4(), DecorationTemplate.getErrorTemplate(), 'error');
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
