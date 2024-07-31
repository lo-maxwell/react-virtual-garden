import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../ItemTypes";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class SeedTemplate extends InventoryItemTemplate{
	transformId: string;
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string) {
		super(id, name, icon, type, subtype, value);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new SeedTemplate("1019999", "error", "❌", "InventoryItem", "Seed", 0, "0029999");
	}

	static fromPlainObject(plainObject: any): SeedTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for SeedTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for SeedTemplate');
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for SeedTemplate');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for SeedTemplate');
			}
			if (typeof type !== 'string' || type !== ItemTypes.INVENTORY.name) {
				throw new Error('Invalid type property in plainObject for SeedTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.SEED.name) {
				throw new Error('Invalid subtype property in plainObject for SeedTemplate');
			}
			if (typeof value !== 'number') {
				throw new Error('Invalid value property in plainObject for SeedTemplate');
			}
			if (typeof transformId !== 'string') {
				throw new Error('Invalid transformId property in plainObject for SeedTemplate');
			}
			return new SeedTemplate(id, name, icon, type, subtype, value, transformId);
		} catch (err) {
			console.error('Error creating SeedTemplate from plainObject:', err);
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