import { PlacedItem } from "./items/placedItems/PlacedItem";

export class Plot {
	item: PlacedItem;
	xPosition: number;
	yPosition: number;

	constructor(item: PlacedItem, xPosition: number, yPosition: number) {
		this.item = item;
		this.xPosition = xPosition;
		this.yPosition = yPosition;
	}

}