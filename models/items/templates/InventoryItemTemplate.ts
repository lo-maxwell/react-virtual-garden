import { ItemSubtype, ItemType } from "../ItemTypes";
import { ItemTemplate } from "./ItemTemplate";

export abstract class InventoryItemTemplate extends ItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number) {
		super(id, name, icon, type, subtype, value);
	}

	// static getErrorTemplate() {
	// 	return new InventoryItemTemplate("-2", "error", "❌", "InventoryItem", "Seed", 0);
	// }

	// static fromPlainObject(plainObject: any): InventoryItemTemplate {
	// 	try {
    //         // Validate plainObject structure
    //         if (!plainObject || typeof plainObject !== 'object') {
    //             throw new Error('Invalid plainObject structure for InventoryItemTemplate');
    //         }
	// 		const { id, name, icon, type, subtype, value } = plainObject;
	// 		// Perform additional type checks if necessary
	// 		return new InventoryItemTemplate(id, name, icon, type, subtype, value);
	// 	} catch (err) {
	// 		//TODO: Replace with Placeholder Template
	// 		console.error('Error creating InventoryItemTemplate from plainObject:', err);
    //         return this.getErrorTemplate();
	// 	}
	// }

	static fromPlainObject(plainObject: any): InventoryItemTemplate {
        throw new Error("fromPlainObject must be implemented in subclasses");
    }

	abstract toPlainObject(): any;

	// toPlainObject(): any {
	// 	return {
	// 		id: this.id,
	// 		name: this.name,
	// 		icon: this.icon,
	// 		type: this.type,
	// 		subtype: this.subtype,
	// 		value: this.value
	// 	}
	// } 

}