import { Item } from "../Item";
import { ItemTemplate } from "../ItemTemplate";

export class PlacedItem extends Item { 
	status: String;

	constructor(itemData: ItemTemplate, status: String) {
		super(itemData);
		this.status = status;
	}
}