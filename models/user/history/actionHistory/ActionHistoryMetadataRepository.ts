import historyData from '@/data/final/ActionHistories.json';
import ActionHistoryInterface from "./ActionHistoryInterface";

export class ActionHistoryMetadataRepository {
	histories: ActionHistoryInterface[];

	constructor() {
		this.histories = [];
		this.loadHistory();
	}

  	loadHistory() {
		historyData.ActionHistories.forEach((history: any) => {
			this.histories.push(this.createActionHistory(history));
		})
  	}

	private createActionHistory(history: any): ActionHistoryInterface {
		return {
			name: history.name,
			description: history.description,
			identifier: history.identifier,
			quantity: 0
		}
	}


	/**
	 * 
	 * @name the history name
	 * @returns the found actionHistory object or null
	 */
	 getActionHistoryInterfaceByName(name: string): ActionHistoryInterface | null {
		const histories = Object.values(this.histories).flat().filter(history => history.name === name);
		if (histories.length === 1) return histories[0];
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
	 * @returns the found actionHistory object or null
	 */
	getActionHistoryInterfaceByIdentifiers(subtype: string, category: string, action: string): ActionHistoryInterface | null {
		const identifierString = `${subtype.toLowerCase()}:${category.toLowerCase()}:${action.toLowerCase()}`;
		return this.getActionHistoryInterfaceByIdentifierString(identifierString);
	}

	/**
	 * 
	 * @identifier the identifier
	 * @returns the found actionHistory object or null
	 */
	 getActionHistoryInterfaceByIdentifierString(identifier: string): ActionHistoryInterface | null {
		const histories = Object.values(this.histories).flat().filter(history => history.identifier === identifier);
		if (histories.length === 1) return histories[0];
		else if (histories.length === 0) return null;
		else {
			console.error('Error: found multiple histories with the same name!');
			console.error(histories);
			return null;
		}
	}

}

export const actionHistoryMetadataRepository = new ActionHistoryMetadataRepository();