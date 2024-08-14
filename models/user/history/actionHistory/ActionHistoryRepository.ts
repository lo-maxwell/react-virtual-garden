import ActionHistory from "./ActionHistory";
import historyData from '@/data/user/ActionHistories.json';
import ActionHistoryInterface from "./ActionHistoryInterface";

export class ActionHistoryRepository {
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

}