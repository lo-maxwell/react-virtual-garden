import { BooleanResponse } from "@/models/utility/BooleanResponse";
import { CustomResponse } from "@/models/utility/CustomResponse";
import ActionHistory from "./actionHistory/ActionHistory";
import { ActionHistoryTransactionResponse } from "./actionHistory/ActionHistoryTransactionResponse";

export class ActionHistoryList {
	private histories: ActionHistory[];
	constructor(histories: ActionHistory[] = []) {
		this.histories = histories;
	}

	static fromPlainObject(plainObject: any): ActionHistoryList {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ActionHistoryList');
            }
			const { actionHistories } = plainObject;
			const histories = actionHistories.map((actionHistory: any) => {
				if (!actionHistory) return null;
				return ActionHistory.fromPlainObject(actionHistory);
			}).filter((item: null | ActionHistory) => item !== null);
			return new ActionHistoryList(histories);
			
		} catch (err) {
			console.error('Error creating ActionHistoryList from plainObject:', err);
            return new ActionHistoryList();
		}
	}

	toPlainObject(): any {
		const toReturn = {
			actionHistories: this.histories.map(ActionHistory => {
				return ActionHistory.toPlainObject();
			}) // Convert each ActionHistory to a plain object
		};
		return toReturn;
	} 

	/**
	 * @returns a copy of the action histories within the list.
	 */
	getAllHistories(): ActionHistory[] {
		return this.histories.slice();
	}

	/**
     * Check if the history list contains a history
     * @subtype plant, decoration, etc
	 * @category tree fruit, onion, normal etc
	 * @action harvested, placed, etc
     * @returns BooleanResponse containing True/False or error message.
     */
	 getHistoryByIdentifier(subtype: string, category: string, action: string): ActionHistoryTransactionResponse {
		const identifierString = `${subtype.toLowerCase()}:${category.toLowerCase()}:${action.toLowerCase()}`;
		return this.getHistoryByIdentifierString(identifierString);
	}

	/**
     * Check if the history list contains a history
     * @identifier the identifier
     * @returns BooleanResponse containing True/False or error message.
     */
	getHistoryByIdentifierString(identifier: string): ActionHistoryTransactionResponse {
		const response = new ActionHistoryTransactionResponse();

		this.histories.forEach((element, index) => {
			if (element.getIdentifier() == identifier) {
				response.payload = element;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.addErrorMessage(`ActionHistory for ${identifier} not found`);
		return response;
	}

	/**
     * Check if the history list contains a history
     * @subtype plant, decoration, etc
	 * @category tree fruit, onion, normal etc
	 * @action harvested, placed, etc
     * @returns BooleanResponse containing True/False or error message.
     */
	containsIdentifier(subtype: string, category: string, action: string): BooleanResponse {
		const identifierString = `${subtype.toLowerCase()}:${category.toLowerCase()}:${action.toLowerCase()}`;
		return this.containsIdentifierString(identifierString);
	}

	/**
     * Check if the history list contains a history
     * @identifier the identifier
     * @returns BooleanResponse containing True/False or error message.
     */
	 containsIdentifierString(identifier: string): BooleanResponse {
		const response = new BooleanResponse();
		this.histories.forEach((element, index) => {
			if (element.getIdentifier() == identifier) {
				response.payload = true;
				return response;
			}
		})
		return response;
	}

	/**
     * Add an ActionHistory object to the history list
     * @newHistory the history object to add
     * @returns ActionHistoryTransactionResponse containing the added history or error message
     */
	addActionHistory(newHistory: ActionHistory): ActionHistoryTransactionResponse {
		const response = new ActionHistoryTransactionResponse();
		//Check if history already contains this type
		if (this.containsIdentifierString(newHistory.getIdentifier()).payload) {
			//Update existing history
			const updateHistoryResponse = this.updateActionHistory(newHistory);
			if (!updateHistoryResponse.isSuccessful()) {
				return updateHistoryResponse;
			}
			response.payload = updateHistoryResponse.payload;
		} else {
			//Add new history
			this.histories.push(newHistory);
			response.payload = newHistory;
		}
		return response;
	}

	/**
     * Update values in the history by combining 2 history objects.
     * @newHistory the history object to combine into original
     * @returns ActionHistoryTransactionResponse containing the updated history or error message.
     */
	updateActionHistory(newHistory: ActionHistory): ActionHistoryTransactionResponse {
		const response = new ActionHistoryTransactionResponse();
		if (this.containsIdentifierString(newHistory.getIdentifier()).payload) {
			const getHistoryResponse = this.getHistoryByIdentifierString(newHistory.getIdentifier());
			const originalHistory = getHistoryResponse.payload;
			if (!getHistoryResponse.isSuccessful() || !originalHistory) {
				//Should never occur, since we just checked contains
				return getHistoryResponse;
			}
			if (originalHistory.getName() !== newHistory.getName() || originalHistory.getDescription() !== newHistory.getDescription() || originalHistory.getIdentifier() !== newHistory.getIdentifier()) {
				response.addErrorMessage(`Error: cannot merge non matching action histories: ${originalHistory.getName()} and ${newHistory.getName()}`)
				return response;
			}
			const combineResponse = originalHistory.combineHistory(newHistory);
			if (!combineResponse.isSuccessful()) {
				return combineResponse;
			}
			response.payload = combineResponse.payload;
		} else {
			response.addErrorMessage(`Error: Could not find history matching that name in HistoryList`);
			return response;
		}
		return response;
	}

	/**
     * Delete a history from the list.
     * @subtype plant, decoration, etc
	 * @category tree fruit, onion, normal etc
	 * @action harvested, placed, etc
     * @returns ActionHistoryTransactionResponse containing the deleted ActionHistory or error message.
     */
	deleteHistoryByIdentifier(subtype: string, category: string, action: string): ActionHistoryTransactionResponse {
		const identifierString = `${subtype.toLowerCase()}:${category.toLowerCase()}:${action.toLowerCase()}`;
		return this.deleteHistoryByIdentifierString(identifierString);
	}

	/**
     * Delete a history from the list.
     * @identifier the identifier of the history to delete
     * @returns ActionHistoryTransactionResponse containing the deleted ActionHistory or error message.
     */
	 deleteHistoryByIdentifierString(identifier: string): ActionHistoryTransactionResponse {
		const response = new ActionHistoryTransactionResponse();
		if (this.containsIdentifierString(identifier).payload) {
			const getHistoryResponse = this.getHistoryByIdentifierString(identifier);
			const originalHistory = getHistoryResponse.payload;
			if (!getHistoryResponse.isSuccessful() || !originalHistory) {
				//Should never occur, since we just checked contains
				return getHistoryResponse;
			}
			const toDeleteIndex = this.histories.indexOf(originalHistory);
			this.histories.splice(toDeleteIndex, 1);
			response.payload = originalHistory;
		} else {
			response.addErrorMessage(`Error: Could not find history matching that identifier in HistoryList`);
			return response;
		}
		return response;
	}

	/**
	 * Deletes all items from the inventory.
	 * @returns CustomResponse containing the deleted ItemHistoryList or error message.
	 */
	deleteAll(): CustomResponse<ActionHistory[]> {
		const response = new CustomResponse<ActionHistory[]>();
		response.payload = this.getAllHistories();
		this.histories = [];
		return response;
	}

	size(): number {
		return this.histories.length;
	}
}