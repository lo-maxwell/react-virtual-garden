import { ItemSubtype, ItemType } from "../ItemTypes";
import { ItemTemplate } from "./ItemTemplate";

export class PlacedItemTemplate extends ItemTemplate{
	transformId: number;
	
	constructor(id: number, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: number) {
		super(id, name, icon, type, subtype, value);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new PlacedItemTemplate(-1, "error", "❌", "PlacedItem", "Plant", 0, -1);
	}
	
	static fromPlainObject(plainObject: any): PlacedItemTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId } = plainObject;
			// Perform additional type checks if necessary
			return new PlacedItemTemplate(id, name, icon, type, subtype, value, transformId);
		} catch (err) {
			//TODO: Replace with Placeholder Template
			console.error('Error creating ItemTemplate from plainObject:', err);
            return new PlacedItemTemplate(-1, "error", "❌", "PlacedItem", "Plant", 0, -1);
		}
	}

	toPlainObject(): any {
		return {
			id: this.id,
			name: this.name,
			icon: this.icon,
			type: this.type,
			subtype: this.subtype,
			value: this.value,
			transformId: this.transformId
		}
	} 


}