import { Item } from "../Item";
import { ItemTemplate } from "../ItemTemplate";

export class InventoryItem extends Item {
	quantity: number;
	
	constructor(itemData: ItemTemplate, quantity: number) {
		super(itemData);
		this.quantity = quantity;
	}
}