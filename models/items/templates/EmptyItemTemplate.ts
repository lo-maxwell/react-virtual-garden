import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../ItemTypes";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class EmptyItemTemplate extends PlacedItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string) {
		super(id, name, icon, type, subtype, value, transformId);
	}

	static getErrorTemplate() {
		return new EmptyItemTemplate("0009999", "error", "❌", "PlacedItem", "Ground", 0, "0009999");
	}

	static fromPlainObject(plainObject: any): EmptyItemTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for EmptyItemTemplate');
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for EmptyItemTemplate');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for EmptyItemTemplate');
			}
			if (typeof type !== 'string' || type !== ItemTypes.PLACED.name) {
				throw new Error('Invalid type property in plainObject for EmptyItemTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.GROUND.name) {
				throw new Error('Invalid subtype property in plainObject for EmptyItemTemplate');
			}
			if (typeof value !== 'number') {
				throw new Error('Invalid value property in plainObject for EmptyItemTemplate');
			}
			if (typeof transformId !== 'string') {
				throw new Error('Invalid transformId property in plainObject for EmptyItemTemplate');
			}
			return new EmptyItemTemplate(id, name, icon, type, subtype, value, transformId);
		} catch (err) {
			console.error('Error creating EmptyItemTemplate from plainObject:', err);
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