import { Item } from "../Item";
import { ItemTemplate } from "../ItemTemplate";

export class PlacedItem extends Item { 
	status: string;

	constructor(itemData: ItemTemplate, status: string) {
		super(itemData);
		this.status = status;
	}

	/**
	 * @returns the status
	 */
	 getStatus(): string {
		return this.status.slice();
	}

	/** Replaces the existing status
	 * @status the new status
	 */
	setStatus(status: string): void {
		this.status = status;
	}
}