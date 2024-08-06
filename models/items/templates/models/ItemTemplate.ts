import { ItemSubtype, ItemType } from "../../ItemTypes";

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

	abstract toPlainObject(): any;

	getPrice(multiplier: number) {
		return Math.max(1, Math.floor(this.value * multiplier + 0.5));
	}
}

