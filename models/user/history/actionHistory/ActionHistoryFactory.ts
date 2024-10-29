import ActionHistory from "./ActionHistory";
import { ActionHistoryMetadataRepository } from "./ActionHistoryMetadataRepository";
import { v4 as uuidv4 } from 'uuid';

class ActionHistoryFactory {
	repository: ActionHistoryMetadataRepository;

	constructor() {
		this.repository = new ActionHistoryMetadataRepository();
	}

	/**
	 * 
	 * @name the history name
	 * @quantity
	 * @returns the created actionHistory object or null
	 */
	createActionHistoryByName(name: string, quantity: number): ActionHistory | null {
		const histories = Object.values(this.repository.histories).flat().filter(history => history.name === name);
		if (histories.length === 1) return new ActionHistory(uuidv4(), histories[0].name, histories[0].description, histories[0].identifier, quantity);
		else if (histories.length === 0) return null;
		else {
			console.error('Error: found multiple histories with the same name!');
			console.error(histories);
			return null;
		}
	}

	/**
	 * 
	 * @subtype plant, decoration, etc
	 * @category tree fruit, onion, normal etc
	 * @action harvest, place, etc
	 * @returns the created actionHistory object or null
	 */
	createActionHistoryByIdentifiers(subtype: string, category: string, action: string, quantity: number): ActionHistory | null {
		const identifierString = `${subtype.toLowerCase()}:${category.toLowerCase()}:${action.toLowerCase()}`;
		return this.createActionHistoryByIdentifierString(identifierString, quantity);
	}

	/**
	 * 
	 * @identifier the identifier
	 * @quantity
	 * @returns the created actionHistory object or null
	 */
	 createActionHistoryByIdentifierString(identifier: string, quantity: number): ActionHistory | null {
		const histories = Object.values(this.repository.histories).flat().filter(history => history.identifier === identifier);
		if (histories.length === 1) return new ActionHistory(uuidv4(), histories[0].name, histories[0].description, histories[0].identifier, quantity);		
		else if (histories.length === 0) return null;
		else {
			console.error('Error: found multiple histories with the same name!');
			console.error(histories);
			return null;
		}
	}
}

export const actionHistoryFactory = new ActionHistoryFactory();