import { BooleanResponse } from "@/models/utility/BooleanResponse";
import ActionHistory from "./actionHistory/ActionHistory";
import { actionHistoryFactory } from "./actionHistory/ActionHistoryFactory";
import { ActionHistoryTransactionResponse } from "./actionHistory/ActionHistoryTransactionResponse";

export class ActionHistoryList {
	private history: ActionHistory[];
	constructor(history: ActionHistory[] = []) {
		this.history = history;
	}

	static fromPlainObject(plainObject: any): ActionHistoryList {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for PlantHistory');
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
			actionHistories: this.history.map(ActionHistory => {
				return ActionHistory.toPlainObject();
			}) // Convert each InventoryItem to a plain object
		};
		return toReturn;
	} 

	/**
	 * @returns a copy of the inventory items within the list.
	 */
	getAllHistories(): ActionHistory[] {
		return this.history.slice();
	}

	/**
     * Get a history object from the list, based on name
     * @name the history name to search for
     * @returns ActionHistoryTransactionResponse containing the found ActionHistory or error message.
     */
	getHistory(name: string): ActionHistoryTransactionResponse {
		const response = new ActionHistoryTransactionResponse();

		this.history.forEach((element, index) => {
			if (element.getName() == name) {
				response.payload = element;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.addErrorMessage(`ActionHistory for ${name} not found`);
		return response;
	}

	/**
     * Check if the history list contains a history
     * @name the history name to search for
     * @returns BooleanResponse containing True/False or error message.
     */
	contains(name: string): BooleanResponse {
		const response = new BooleanResponse();
		
		this.history.forEach((element, index) => {
			if (element.getName() == name) {
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
		if (this.contains(newHistory.getName()).payload) {
			//Update existing history
			const updateHistoryResponse = this.updateActionHistory(newHistory);
			if (!updateHistoryResponse.isSuccessful()) {
				return updateHistoryResponse;
			}
			response.payload = updateHistoryResponse.payload;
		} else {
			//Add new history
			this.history.push(newHistory);
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
		if (this.contains(newHistory.getName()).payload) {
			const getHistoryResponse = this.getHistory(newHistory.getName());
			const originalHistory = getHistoryResponse.payload;
			if (!getHistoryResponse.isSuccessful() || !originalHistory) {
				//Should never occur, since we just checked contains
				return getHistoryResponse;
			}
			if (originalHistory.getName() !== newHistory.getName()) {
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
}