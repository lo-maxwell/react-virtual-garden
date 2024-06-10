import { ItemTemplate } from "./ItemTemplate";

export class Item {
	itemData: ItemTemplate;
	constructor(itemData: ItemTemplate) {
		this.itemData = itemData;
	}
}