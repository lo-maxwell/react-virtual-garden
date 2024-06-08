import { ItemTemplate } from "../ItemTemplate";
import { InventoryItem } from "./InventoryItem";

export class Blueprint extends InventoryItem {
	constructor(itemData: ItemTemplate, quantity: number) {
		super(itemData, quantity);
	}
}