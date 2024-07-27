import { ItemSubtype, ItemType } from "../ItemTypes";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class BlueprintTemplate extends InventoryItemTemplate{
	transformId: number;
	constructor(id: number, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: number) {
		super(id, name, icon, type, subtype, value);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new BlueprintTemplate(-2, "error", "❌", "InventoryItem", "Blueprint", 0, -2);
	}

	static fromPlainObject(plainObject: any): BlueprintTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for InventoryItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId } = plainObject;
			// Perform additional type checks if necessary
			return new BlueprintTemplate(id, name, icon, type, subtype, value, transformId);
		} catch (err) {
			//TODO: Replace with Placeholder Template
			console.error('Error creating InventoryItemTemplate from plainObject:', err);
            return new BlueprintTemplate(-2, "error", "❌", "InventoryItem", "Blueprint", 0, -2);
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