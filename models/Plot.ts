import { Item } from "./items/Item";
import { PlacedItem } from "./items/placedItems/PlacedItem";

export class Plot {
	item: PlacedItem;

	constructor(item: PlacedItem) {
		this.item = item;
	}

	/**
	 * @returns a copy of this plot.
	 */
	clone() {
		return new Plot(this.item);
	}

	/**
	 * @returns a copy of the item contained by this plot
	 */
	getItem(): PlacedItem {
		return new PlacedItem(this.item.itemData, this.item.status);
	}

	/** Replaces the existing item with a new one.
	 * @item the item to replace with
	 * @returns the changed item.
	 */
	setItem(item: PlacedItem): PlacedItem {
		this.item = item;
		return this.item;
	}

	/**
	 * @returns the status
	 */
	 getItemStatus(): string {
		return this.item.getStatus();
	}

	/** Replaces the existing status
	 * @status the new status
	 */
	setItemStatus(status: string): void {
		this.item.setStatus(status);
	}
}