import { InventoryItemList } from "../itemStore/InventoryItemList";
import { UserEventType, UserEventTypes } from "../user/userEvents/UserEventTypes";

export interface EventRewardInterface {
	eventType: UserEventType;
	userId: string;
	inventoryId: string;
	streak: number;
 	items: any; //InventoryItemListPlainObject
	gold: number;
	message: string;
}

export interface EventRewardEntity {
	id: number;
	owner: number;
	inventory?: string;
	gold: number;
	message?: string;
}

export interface EventRewardItemEntity {
	id: string;
	owner: number;
	identifier: string;
	quantity: number;
}

export class EventReward implements EventRewardInterface {
	eventType: UserEventType = UserEventTypes.ERROR.name;
	userId = "";
	inventoryId = "";
	streak = 0;
	items: InventoryItemList = new InventoryItemList();
	gold = 0;
	message = "";

	constructor(init?: Partial<EventRewardInterface>) {
	  Object.assign(this, init);
	}

	static fromPlainObject(plainObject: any): EventReward {
		try {
			// Validate plainObject structure
			if (!plainObject || typeof plainObject !== 'object') {
				throw new Error('Invalid plainObject structure for EventReward');
			}
			
			const { eventType, userId, inventoryId, streak, items, gold, message } = plainObject;
			
			// Perform additional type checks if necessary
			if (typeof userId !== 'string' || typeof inventoryId !== 'string' || 
				typeof streak !== 'number' || typeof gold !== 'number' || 
				typeof message !== 'string') {
				throw new Error('Invalid property types in plainObject for EventReward');
			}
			
			const itemsInstance = items ? InventoryItemList.fromPlainObject(items) : new InventoryItemList();
			
			return new EventReward({
				eventType: eventType || UserEventTypes.ERROR.name,
				userId,
				inventoryId,
				streak,
				gold,
				message
			}).setItems(itemsInstance);
		} catch (error) {
			console.error('Error creating EventReward from plainObject:', error);
			return new EventReward();
		}
	}

	toPlainObject(): any {
		return {
			eventType: this.eventType,
			userId: this.userId,
			inventoryId: this.inventoryId,
			streak: this.streak,
			items: this.items.toPlainObject(),
			gold: this.gold,
			message: this.message
		};
	}

	static getDefaultEventReward(): EventReward {
		return new EventReward();
	}

	getEventType(): UserEventType {
		return this.eventType;
	}

	setEventType(newEventType: UserEventType) {
		this.eventType = newEventType;
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
		return this; // Return this for method chaining
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
