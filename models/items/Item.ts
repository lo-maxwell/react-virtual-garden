import { InventoryItemTemplate } from "./templates/models/InventoryItemTemplates/InventoryItemTemplate";
import { PlacedItemTemplate } from "./templates/models/PlacedItemTemplates/PlacedItemTemplate";

export class Item {
	itemData: PlacedItemTemplate | InventoryItemTemplate
	constructor(itemData: PlacedItemTemplate | InventoryItemTemplate) {
		this.itemData = itemData;
	}

	static areEquivalent(item1: Item, item2: Item) {
		return item1.itemData == item2.itemData;
	}
}