import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../ItemTypes";
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
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for HarvestedItemTemplate');
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for HarvestedItemTemplate');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for HarvestedItemTemplate');
			}
			if (typeof type !== 'string' || type !== ItemTypes.INVENTORY.name) {
				throw new Error('Invalid type property in plainObject for HarvestedItemTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.HARVESTED.name) {
				throw new Error('Invalid subtype property in plainObject for HarvestedItemTemplate');
			}
			if (typeof value !== 'number') {
				throw new Error('Invalid value property in plainObject for HarvestedItemTemplate');
			}
			return new HarvestedItemTemplate(id, name, icon, type, subtype, value);
		} catch (err) {
			console.error('Error creating HarvestedItemTemplate from plainObject:', err);
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