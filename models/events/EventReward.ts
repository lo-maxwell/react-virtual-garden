import { InventoryItemList } from "../itemStore/InventoryItemList";

export interface EventRewardInterface {
	userId: string;
	inventoryId: string;
	streak: number;
	items: InventoryItemList;
	gold: number;
	message: string;
}

export class EventReward implements EventRewardInterface{
	userId = "";
	inventoryId = "";
	streak = 0;
	items: InventoryItemList = new InventoryItemList();
	gold = 0;
	message = "";

	constructor(init?: Partial<EventRewardInterface>) {
	  Object.assign(this, init);
	}

	getUserId(): string {
		return this.userId;
	}

	setUserId(userId: string) {
		this.userId = userId;
	}

	getInventoryId(): string {
		return this.inventoryId;
	}

	setInventoryId(inventoryId: string) {
		this.inventoryId = inventoryId;
	}

	getStreak(): number {
		return this.streak;
	}

	setStreak(streak: number) {
		this.streak = streak;
	}

	getItems(): InventoryItemList {
		return this.items;
	}

	setItems(items: InventoryItemList) {
		this.items = items;
	}

	getGold(): number {
		return this.gold;
	}

	setGold(gold: number) {
		this.gold = gold;
	}

	getMessage(): string {
		return this.message;
	}

	setMessage(message: string) {
		this.message = message;
	}
  }