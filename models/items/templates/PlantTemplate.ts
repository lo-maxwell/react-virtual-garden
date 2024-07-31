import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../ItemTypes";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class PlantTemplate extends PlacedItemTemplate{
	baseExp: number;
	growTime: number;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string, baseExp: number, growTime: number) {
		super(id, name, icon, type, subtype, value, transformId);
		this.baseExp = baseExp;
		this.growTime = growTime;
	}

	static getErrorTemplate() {
		return new PlantTemplate("0029999", "error", "❌", "PlacedItem", "Plant", 0, "1039999", 0, 0);
	}

	static fromPlainObject(plainObject: any): PlantTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, icon, type, subtype, value, transformId, baseExp, growTime } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for PlantTemplate');
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for PlantTemplate');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for PlantTemplate');
			}
			if (typeof type !== 'string' || type !== ItemTypes.PLACED.name) {
				throw new Error('Invalid type property in plainObject for PlantTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.PLANT.name) {
				throw new Error('Invalid subtype property in plainObject for PlantTemplate');
			}
			if (typeof value !== 'number') {
				throw new Error('Invalid value property in plainObject for PlantTemplate');
			}
			if (typeof transformId !== 'string') {
				throw new Error('Invalid transformId property in plainObject for PlantTemplate');
			}
			if (typeof baseExp !== 'number') {
				throw new Error('Invalid baseExp property in plainObject for PlantTemplate');
			}
			if (typeof growTime !== 'number') {
				throw new Error('Invalid growTime property in plainObject for PlantTemplate');
			}
			return new PlantTemplate(id, name, icon, type, subtype, value, transformId, baseExp, growTime);
		} catch (err) {
			console.error('Error creating PlantTemplate from plainObject:', err);
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
			baseExp: this.baseExp,
			growTime: this.growTime
		}
	} 

}