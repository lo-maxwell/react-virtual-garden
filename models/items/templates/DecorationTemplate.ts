import { ItemSubtype, ItemType } from "../ItemTypes";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class DecorationTemplate extends PlacedItemTemplate{
	
	constructor(id: number, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: number) {
		super(id, name, icon, type, subtype, value, transformId);
	}

	static getErrorTemplate() {
		return new DecorationTemplate(-1, "error", "❌", "PlacedItem", "Decoration", 0, -1);
	}

	static fromPlainObject(plainObject: any): DecorationTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId } = plainObject;
			// Perform additional type checks if necessary
			return new DecorationTemplate(id, name, icon, type, subtype, value, transformId);
		} catch (err) {
			//TODO: Replace with Placeholder Template
			console.error('Error creating ItemTemplate from plainObject:', err);
            return new DecorationTemplate(-1, "error", "❌", "PlacedItem", "Decoration", 0, -1);
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