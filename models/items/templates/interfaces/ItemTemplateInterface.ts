import { ItemType, ItemSubtype } from "../../ItemTypes";

export interface ItemTemplateInterface {
	id: string;
	name: string;
	icon: string;
	type: ItemType;
	subtype: ItemSubtype;
	category: string;
	description: string;
	value: number;
  }