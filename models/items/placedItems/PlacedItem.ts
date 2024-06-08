import { ItemTemplate } from "../ItemTemplate";

export class PlacedItem {
	itemData: ItemTemplate;
	status: String;
	constructor(itemData: ItemTemplate, status: String) {
		this.itemData = itemData;
		this.status = status;
	}
}