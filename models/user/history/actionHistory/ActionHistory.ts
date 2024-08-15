import { actionHistoryRepository } from "./ActionHistoryRepository";
import { ActionHistoryTransactionResponse } from "./ActionHistoryTransactionResponse";

export default class ActionHistory {

	protected name: string;
	protected description: string;
	protected identifier: string;
	protected quantity: number;
	
	constructor(name: string, description: string, identifier: string, quantity: number) {
		this.name = name;
		this.description = description;
		this.identifier = identifier;
		this.quantity = quantity;
	}

	getName(): string {
		return this.name;
	}
	
	getIdentifier(): string {
		return this.identifier;
	}

	getDescription(): string {
		return this.description;
	}

	setDescription(newDescription: string): void {
		this.description = newDescription;
	}

	getQuantity(): number {
		return this.quantity;
	}

	setQuantity(newQuantity: number): void {
		this.quantity = newQuantity;
	}

	updateQuantity(delta: number): number {
		this.quantity += delta;
		return this.quantity;
	}

	/**
	 * Can return null if format is incorrect
	 */
	static fromPlainObject(plainObject: any) {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ActionHistory');
            }
			const { name, description, identifier, quantity } = plainObject;
			// Perform additional type checks if necessary
			if (typeof name !== 'string') {
				throw new Error('Invalid name in plainObject for ActionHistory');
			}
			if (typeof description !== 'string') {
				throw new Error('Invalid description in plainObject for ActionHistory');
			}
			if (typeof identifier !== 'string') {
				throw new Error('Invalid identifier in plainObject for ActionHistory');
			}
			if (typeof quantity !== 'number') {
				throw new Error('Invalid quantity in plainObject for ActionHistory');
			}

			//Fetch existing data based on identifier
			let updatedActionHistory = actionHistoryRepository.getActionHistoryInterfaceByIdentifierString(identifier);
			if (updatedActionHistory != null) {
				return new ActionHistory(updatedActionHistory.name, updatedActionHistory.description, updatedActionHistory.identifier, quantity);
			}

			//Fetch existing data based on name
			updatedActionHistory = actionHistoryRepository.getActionHistoryInterfaceByName(name);
			if (updatedActionHistory != null) {
				return new ActionHistory(updatedActionHistory.name, updatedActionHistory.description, updatedActionHistory.identifier, quantity);
			}
			
			//Create new object -- danger -- should be unnecessary unless large data migration was made
			console.error(`Created new ActionHistory object: ${name}, ${description}, ${identifier}`);
			return new ActionHistory(name, description, identifier, quantity);
			
		} catch (err) {
			console.error('Error creating ActionHistory from plainObject:', err);
            return null;
		}
	}

	toPlainObject(): any {
		return {
			name: this.name,
			description: this.description,
			identifier: this.identifier,
			quantity: this.quantity,
		};
	}

	/**
	 * Combines the quantity from the given history into this one.
	 * @history the history to combine with
	 * @returns ActionHistoryTransactionResponse containing the updated ActionHistory or an error message
	 */
	combineHistory(history: ActionHistory): ActionHistoryTransactionResponse {
		const response = new ActionHistoryTransactionResponse();
		if (history.quantity < 0) {
			response.addErrorMessage('Error combining ActionHistory: invalid quantity');
			return response;
		}
		if (history.getName() !== this.name || history.getDescription() !== this.description || history.getIdentifier() !== this.identifier) {
			response.addErrorMessage('Error combining ActionHistory: not identical name, description, or identifier');
			return response;
		}
		this.updateQuantity(history.getQuantity());
		response.payload = this;
		return response;
	}
}