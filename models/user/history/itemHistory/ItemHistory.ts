import { ItemTemplate } from "@/models/items/templates/models/ItemTemplate";
import { getItemTemplateFromSubtype } from "@/models/items/utility/classMaps";
import { ItemHistoryTransactionResponse } from "./ItemHistoryTransactionResponse";
class ItemHistory {
	protected itemData: ItemTemplate;
	protected quantity: number;
	
	constructor(item: ItemTemplate, quantity: number) {
		this.itemData = item;
		this.quantity = quantity;
	}
	
	/**
	 * Can return null if format is incorrect
	 */
	 static fromPlainObject(plainObject: any) {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemHistory');
            }
			const { itemData, quantity } = plainObject;
			// Perform additional type checks if necessary
			const itemTemplate = getItemTemplateFromSubtype(itemData);
			if (!itemTemplate) {
				throw new Error(`Invalid itemData in plainObject for itemHistory`);
			}
			const validatedItemData = itemTemplate.fromPlainObject(itemData);
			if (typeof quantity !== 'number') {
				throw new Error('Invalid quantity in plainObject for ItemHistory');
			}
			return new ItemHistory(validatedItemData, quantity);
			
		} catch (err) {
			console.error('Error creating ItemHistory from plainObject:', err);
            return null;
		}
	}

	toPlainObject(): any {
		return {
			itemData: this.itemData,
			quantity: this.quantity
		};
	}

	/**
	 * @returns the itemtemplate for this history
	 */
	getItemData(): ItemTemplate {
		return this.itemData;
	}

	/**
	 * @returns the harvested quantity for this history
	 */
	getQuantity(): number {
		return this.quantity;
	}

	/**
	 * @delta the quantity change
	 * @returns the updated quantity
	 */
	updateQuantity(delta: number): number {
		this.quantity += delta;
		return this.quantity;
	}

	/**
	 * Combines all fields from the given history into this one.
	 * @history the history to combine with
	 * @returns ItemHistoryTransactionResponse containing the updated ItemHistory or an error message
	 */
	combineHistory(history: ItemHistory): ItemHistoryTransactionResponse {
		const response = new ItemHistoryTransactionResponse();
		if (history.quantity < 0) {
			response.addErrorMessage('Error combining ItemHistory: invalid quantity');
			return response;
		}
		if (JSON.stringify(history.getItemData()) != JSON.stringify(this.itemData)) {
			response.addErrorMessage('Error combining ItemHistory: not identical templates');
			return response;
		}
		this.updateQuantity(history.quantity);
		response.payload = this;
		return response;
	}
}

export default ItemHistory;