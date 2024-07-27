import { ItemSubtype, ItemType } from "../ItemTypes";

export abstract class ItemTemplate {
	
	id: string;
	name: string;
	icon: string;
	type: ItemType;
	subtype: ItemSubtype;
	value: number;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number) {
		this.id = id;
		this.name = name;
		this.icon = icon;
		this.type = type;
		this.subtype = subtype;
		this.value = value;
	}

	//Can't enforce static fromPlainObject in subclasses using typescript
	// abstract fromPlainObject(plainObject: any): this;

	// static fromPlainObject(plainObject: any): ItemTemplate {
	// 	try {
    //         // Validate plainObject structure
    //         if (!plainObject || typeof plainObject !== 'object') {
    //             throw new Error('Invalid plainObject structure for ItemTemplate');
    //         }
	// 		const { id, name, icon, type, subtype, basePrice, transformId } = plainObject;
	// 		// Perform additional type checks if necessary
	// 		return new ItemTemplate(id, name, icon, type, subtype, basePrice, transformId);
	// 	} catch (err) {
	// 		console.error('Error creating ItemTemplate from plainObject:', err);
    //         return PlaceholderItemTemplates.PlaceHolderItems.errorInventoryItem;
	// 	}
	// }

	abstract toPlainObject(): any;

	// toPlainObject(): any {
	// 	return {
	// 		id: this.id,
	// 		name: this.name,
	// 		icon: this.icon,
	// 		type: this.type,
	// 		subtype: this.subtype,
	// 		basePrice: this.basePrice,
	// 		transformId: this.transformId
	// 	}
	// } 

	getPrice(multiplier: number) {
		return Math.max(1, Math.floor(this.value * multiplier + 0.5));
	}
}

