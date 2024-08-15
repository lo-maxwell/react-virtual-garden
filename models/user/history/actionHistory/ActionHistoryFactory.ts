import ActionHistory from "./ActionHistory";
import { ActionHistoryRepository } from "./ActionHistoryRepository";

class ActionHistoryFactory {
	repository: ActionHistoryRepository;

	constructor() {
		this.repository = new ActionHistoryRepository();
	}

	/**
	 * 
	 * @name the history name
	 * @returns the created actionHistory object or null
	 */
	 getActionHistoryByName(name: string): ActionHistory | null {
		const histories = Object.values(this.repository.histories).flat().filter(history => history.name === name);
		if (histories.length === 1) return new ActionHistory(histories[0].name, histories[0].description, histories[0].identifier, histories[0].quantity);
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
	getActionHistoryByIdentifiers(subtype: string, category: string, action: string): ActionHistory | null {
		const identifierString = `${subtype.toLowerCase()}:${category.toLowerCase()}:${action.toLowerCase()}`;
		const histories = Object.values(this.repository.histories).flat().filter(history => history.identifier === identifierString);
		if (histories.length === 1) return new ActionHistory(histories[0].name, histories[0].description, histories[0].identifier, histories[0].quantity);		else if (histories.length === 0) return null;
		else {
			console.error('Error: found multiple histories with the same name!');
			console.error(histories);
			return null;
		}
	}

	/**
	 * 
	 * @identifier the identifier
	 * @returns the created actionHistory object or null
	 */
	 getActionHistoryByIdentifierString(identifier: string): ActionHistory | null {
		const histories = Object.values(this.repository.histories).flat().filter(history => history.identifier === identifier);
		if (histories.length === 1) return new ActionHistory(histories[0].name, histories[0].description, histories[0].identifier, histories[0].quantity);		else if (histories.length === 0) return null;
		else {
			console.error('Error: found multiple histories with the same name!');
			console.error(histories);
			return null;
		}
	}
}

export const actionHistoryFactory = new ActionHistoryFactory();