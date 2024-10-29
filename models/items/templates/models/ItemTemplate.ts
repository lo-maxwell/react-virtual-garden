import { ItemSubtype, ItemType } from "../../ItemTypes";
import { ItemTemplateInterface } from "../interfaces/ItemTemplateInterface";

export abstract class ItemTemplate implements ItemTemplateInterface {
	
	id: string;
	name: string;
	icon: string;
	type: ItemType;
	subtype: ItemSubtype;
	category: string;
	description: string;
	value: number;
	level: number;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number) {
		this.id = id;
		this.name = name;
		this.icon = icon;
		this.type = type;
		this.subtype = subtype;
		this.category = category;
		this.description = description;
		this.value = value;
		this.level = level;
	}

	//Can't enforce static fromPlainObject in subclasses using typescript

	abstract toPlainObject(): any;

	getPrice(multiplier: number) {
		return Math.max(1, Math.floor(this.value * multiplier + 0.5));
	}
}

