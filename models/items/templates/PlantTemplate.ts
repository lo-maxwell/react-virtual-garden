import { ItemSubtype, ItemType } from "../ItemTypes";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class PlantTemplate extends PlacedItemTemplate{
	baseExp: number;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string, baseExp: number) {
		super(id, name, icon, type, subtype, value, transformId);
		this.baseExp = baseExp;
	}

	static getErrorTemplate() {
		return new PlantTemplate("0029999", "error", "❌", "PlacedItem", "Plant", 0, "1039999", 0);
	}

	static fromPlainObject(plainObject: any): PlantTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId, baseExp } = plainObject;
			// Perform additional type checks if necessary
			return new PlantTemplate(id, name, icon, type, subtype, value, transformId, baseExp);
		} catch (err) {
			//TODO: Replace with Placeholder Template
			console.error('Error creating ItemTemplate from plainObject:', err);
            return this.getErrorTemplate();
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
			transformId: this.transformId,
			baseExp: this.baseExp
		}
	} 

}