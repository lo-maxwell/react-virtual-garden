import { ItemTemplate } from "../ItemTemplate";
import { PlacedItem } from "./PlacedItem";

export class Plant extends PlacedItem{
	constructor(itemData: ItemTemplate, status: string) {
		super(itemData, status);
	}
}