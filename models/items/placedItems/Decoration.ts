
import { DecorationTemplate } from "../templates/models/DecorationTemplate";
import { PlacedItem } from "./PlacedItem";

export class Decoration extends PlacedItem {
	itemData: DecorationTemplate;
	constructor(itemData: DecorationTemplate, status: string) {
		super(itemData, status);
		this.itemData = itemData;
	}


	static fromPlainObject(plainObject: any): Decoration {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData) {
                throw new Error('Invalid plainObject structure for DecorationItem');
            }
			// Validate required properties
			const { itemData, status } = plainObject;

			if (!itemData || typeof status !== 'string') {
				throw new Error('Invalid properties in plainObject for DecorationItem');
			}
	
			// Validate itemData structure
			const validatedItemData = DecorationTemplate.fromPlainObject(itemData);
	
			return new Decoration(validatedItemData, status);
		} catch (err) {
			console.error('Error creating DecorationItem from plainObject:', err);
            return new Decoration(DecorationTemplate.getErrorTemplate(), 'error');
		}
	}

	toPlainObject(): any {
		return {
			status: this.status,
			itemData: this.itemData.toPlainObject()
		}
	} 
}
