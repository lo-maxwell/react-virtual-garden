import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../ItemTypes";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class DecorationTemplate extends PlacedItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string) {
		super(id, name, icon, type, subtype, value, transformId);
	}

	static getErrorTemplate() {
		return new DecorationTemplate("0049999", "error", "❌", "PlacedItem", "Decoration", 0, "1059999");
	}

	static fromPlainObject(plainObject: any): DecorationTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for DecorationTemplate');
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for DecorationTemplate');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for DecorationTemplate');
			}
			if (typeof type !== 'string' || type !== ItemTypes.PLACED.name) {
				throw new Error('Invalid type property in plainObject for DecorationTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.DECORATION.name) {
				throw new Error('Invalid subtype property in plainObject for DecorationTemplate');
			}
			if (typeof value !== 'number') {
				throw new Error('Invalid value property in plainObject for DecorationTemplate');
			}
			if (typeof transformId !== 'string') {
				throw new Error('Invalid transformId property in plainObject for DecorationTemplate');
			}
			return new DecorationTemplate(id, name, icon, type, subtype, value, transformId);
		} catch (err) {
			console.error('Error creating DecorationTemplate from plainObject:', err);
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