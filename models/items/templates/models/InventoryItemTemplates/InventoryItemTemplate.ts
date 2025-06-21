import { ItemType, ItemSubtype } from "@/models/items/ItemTypes";
import { ItemTemplate } from "../ItemTemplate";


export abstract class InventoryItemTemplate extends ItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number) {
		super(id, name, icon, type, subtype, category, description, value, level);
	}

	static fromPlainObject(plainObject: any): InventoryItemTemplate {
        throw new Error("fromPlainObject must be implemented in subclasses");
    }

	abstract toPlainObject(): any;


}