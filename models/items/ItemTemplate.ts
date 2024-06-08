import { ItemSubtype, ItemType } from "./ItemTypes";

export class ItemTemplate {
	id: number;
	name: string;
	icon: string;
	type: ItemType;
	subtype: ItemSubtype;
	basePrice: number;
	transformId: number; //0 means it disappears after being used
	
	constructor(id: number, name: string, icon: string, type: ItemType, subtype: ItemSubtype, basePrice: number, transformId: number) {
		this.id = id;
		this.name = name;
		this.icon = icon;
		this.type = type;
		this.subtype = subtype;
		this.basePrice = basePrice;
		this.transformId = transformId;
	}
}