import { ItemSubtype, ItemType } from "../../ItemTypes";
import { ItemTemplate } from "./ItemTemplate";

export abstract class InventoryItemTemplate extends ItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number) {
		super(id, name, icon, type, subtype, value);
	}

	static fromPlainObject(plainObject: any): InventoryItemTemplate {
        throw new Error("fromPlainObject must be implemented in subclasses");
    }

	abstract toPlainObject(): any;


}