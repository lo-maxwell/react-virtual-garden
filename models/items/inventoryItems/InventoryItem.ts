import { InventoryTransactionResponse } from "@/models/inventory/InventoryTransactionResponse";
import { Item } from "../Item";
import { ItemTemplate, PlaceholderItemTemplates } from "../ItemTemplate";
import { ItemSubtypes} from "../ItemTypes";

export class InventoryItem extends Item {
	private quantity: number;
	
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

	/** 
	 * Replaces the existing quantity
	 * @status the new quantity
	 */
	setQuantity(quantity: number): void {
		this.quantity = quantity;
	}

	/**
	 * Consumes 1 quantity from the specified item.
	 * Performs a specific action depending on the item type:
	 * Blueprint -> returns the Decoration ItemTemplate corresponding to the Blueprint
	 * Seed -> returns the Plant ItemTemplate corresponding to the Seed
	 * HarvestedItem -> error
	 * @returns a response containing the resulting transformed item template, or an error message
	 */
	use(): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (this.getQuantity() <= 0) {
			response.addErrorMessage(`item lacks the required quantity to use`);
			return response;
		}
		switch(this.itemData.subtype) {
			case ItemSubtypes.BLUEPRINT.name:
			case ItemSubtypes.SEED.name:
				response.payload = PlaceholderItemTemplates.getTransformTemplate(this.itemData.transformId);
				this.setQuantity(this.getQuantity() - 1);
				break;
			default:
				response.addErrorMessage(`item is of type ${this.itemData.subtype}, cannot be used`);
				break;
		}
		return response;
	}
}