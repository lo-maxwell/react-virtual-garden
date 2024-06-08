import { ItemTemplate } from "../ItemTemplate";

export class InventoryItem {
	itemData: ItemTemplate;
	quantity: number;

	constructor(itemData: ItemTemplate, quantity: number) {
		this.itemData = itemData;
		this.quantity = quantity;
	}
}