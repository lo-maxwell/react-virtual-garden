import { ItemTemplate } from "../ItemTemplate";
import { PlacedItem } from "./PlacedItem";

export class EmptyItem extends PlacedItem{
	constructor(itemData: ItemTemplate, status: string) {
		super(itemData, status);
	}
}