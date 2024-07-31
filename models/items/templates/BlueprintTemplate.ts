import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../ItemTypes";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class BlueprintTemplate extends InventoryItemTemplate{
	transformId: string;
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string) {
		super(id, name, icon, type, subtype, value);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new BlueprintTemplate("1059999", "error", "❌", "InventoryItem", "Blueprint", 0, "0049999");
	}

	static fromPlainObject(plainObject: any): BlueprintTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for InventoryItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for BlueprintTemplate');
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for BlueprintTemplate');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for BlueprintTemplate');
			}
			if (typeof type !== 'string' || type !== ItemTypes.INVENTORY.name) {
				throw new Error('Invalid type property in plainObject for BlueprintTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.BLUEPRINT.name) {
				throw new Error('Invalid subtype property in plainObject for BlueprintTemplate');
			}
			if (typeof value !== 'number') {
				throw new Error('Invalid value property in plainObject for BlueprintTemplate');
			}
			if (typeof transformId !== 'string') {
				throw new Error('Invalid transformId property in plainObject for BlueprintTemplate');
			}
			return new BlueprintTemplate(id, name, icon, type, subtype, value, transformId);
		} catch (err) {
			console.error('Error creating BlueprintTemplate from plainObject:', err);
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
			transformId: this.transformId
		}
	} 
}