import { ItemSubtype, ItemType } from "../ItemTypes";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class HarvestedItemTemplate extends InventoryItemTemplate{
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number) {
		super(id, name, icon, type, subtype, value);
	}

	static getErrorTemplate() {
		return new HarvestedItemTemplate("1039999", "error", "❌", "InventoryItem", "HarvestedItem", 0);
	}

	static fromPlainObject(plainObject: any): HarvestedItemTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for InventoryItemTemplate');
            }
			const { id, name, icon, type, subtype, value } = plainObject;
			// Perform additional type checks if necessary
			return new HarvestedItemTemplate(id, name, icon, type, subtype, value);
		} catch (err) {
			//TODO: Replace with Placeholder Template
			console.error('Error creating InventoryItemTemplate from plainObject:', err);
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
			value: this.value
		}
	} 
}