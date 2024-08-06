import { ItemSubtype, ItemType } from "../../ItemTypes";
import { ItemTemplate } from "./ItemTemplate";

export abstract class PlacedItemTemplate extends ItemTemplate{
	transformId: string;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string) {
		super(id, name, icon, type, subtype, value);
		this.transformId = transformId;
	}
	
	static fromPlainObject(plainObject: any): PlacedItemTemplate {
        throw new Error("fromPlainObject must be implemented in subclasses");
    }

	abstract toPlainObject(): any;


}