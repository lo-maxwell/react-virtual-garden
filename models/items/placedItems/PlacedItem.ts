import { GardenTransactionResponse } from "@/models/garden/GardenTransactionResponse";
import { Item } from "../Item";
import { ItemTemplate, PlaceholderItemTemplates } from "../ItemTemplate";
import { ItemSubtypes } from "../ItemTypes";

export class PlacedItem extends Item { 
	private status: string;

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
	 * @param status the new status
	 */
	setStatus(status: string): void {
		this.status = status;
	}

	/**
	 * Consumes the specified item.
	 * Sets the status message to "removed".
	 * Performs a specific action depending on the item type:
	 * Decoration -> returns the Blueprint ItemTemplate corresponding to the Decoration
	 * Plant -> returns the HarvestedItem ItemTemplate corresponding to the Plant
	 * EmptyItem -> error
	 * @returns a response containing the following object, or an error message
	 * {originalItem: PlacedItem
	 *  newTemplate: ItemTemplate}
	 */
	 use(): GardenTransactionResponse {
		const response = new GardenTransactionResponse();
		switch(this.itemData.subtype) {
			case ItemSubtypes.DECORATION.name:
			case ItemSubtypes.PLANT.name:
				response.payload = {
					originalItem: this,
					newTemplate: PlaceholderItemTemplates.getTransformTemplate(this.itemData.transformId),
				};
				this.setStatus('removed');
				break;
			default:
				response.addErrorMessage(`item is of type ${this.itemData.subtype}, cannot be used`);
				break;
		}
		return response;
	}
}