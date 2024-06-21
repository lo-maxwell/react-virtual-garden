import { Item } from "../Item";
import { ItemTemplate } from "../ItemTemplate";

export class InventoryItem extends Item {
	quantity: number;
	
	constructor(itemData: ItemTemplate, quantity: number) {
		super(itemData);
		this.quantity = quantity;
	}
	
	/**
	 * @returns the quantity
	 */
	getQuantity(): number {
		return this.quantity;
	}

	/** Replaces the existing quantity
	 * @status the new quantity
	 */
	setQuantity(quantity: number): void {
		this.quantity = quantity;
	}
}