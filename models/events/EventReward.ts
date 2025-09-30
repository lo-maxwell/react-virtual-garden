import { InventoryItemList } from "../itemStore/InventoryItemList";
import { UserEventType, UserEventTypes } from "../user/userEvents/UserEventTypes";
import { v4 as uuidv4 } from 'uuid';

export interface EventRewardInterface {
	id: string;
	eventType: UserEventType;
	userId: string;
	inventoryId: string;
	streak: number;
 	items: any; //InventoryItemListPlainObject
	gold: number;
	message: string;
}

export interface EventRewardEntity {
	id: string;
	owner: string;
	inventory?: string;
	gold: number;
	message?: string;
}

export interface EventRewardItemEntity {
	id: string;
	owner: string;
	identifier: string;
	quantity: number;
}

export class EventReward implements EventRewardInterface {
	id: string;
	eventType: UserEventType = UserEventTypes.ERROR.name;
	userId = "";
	inventoryId = "";
	streak = 0;
	items: InventoryItemList = new InventoryItemList();
	gold = 0;
	message = "";

	constructor(init?: Partial<EventRewardInterface>) {
	  Object.assign(this, init);
	  this.id = init?.id || uuidv4();
	}

	static fromPlainObject(plainObject: any): EventReward {
		try {
			// Validate plainObject structure
			if (!plainObject || typeof plainObject !== 'object') {
				throw new Error('Invalid plainObject structure for EventReward');
			}
			
			const { id, eventType, userId, inventoryId, streak, items, gold, message } = plainObject;
			
			const finalUserId = typeof userId === 'string' ? userId : "";
			const finalEventType = (typeof finalUserId !== 'string' || finalUserId === "")
				? UserEventTypes.ERROR.name
				: eventType || UserEventTypes.ERROR.name;

			const finalInventoryId = typeof inventoryId === 'string' ? inventoryId : "";
			const finalStreak = typeof streak === 'number' ? streak : 0;
			const finalGold = typeof gold === 'number' ? gold : 0;
			const finalMessage = typeof message === 'string' ? message : "";
			
			const itemsInstance = items ? InventoryItemList.fromPlainObject(items) : new InventoryItemList();
			
			return new EventReward({
				id: id || uuidv4(),
				eventType: finalEventType,
				userId: finalUserId,
				inventoryId: finalInventoryId,
				streak: finalStreak,
				gold: finalGold,
				message: finalMessage
			}).setItems(itemsInstance);
		} catch (error) {
			console.error('Error creating EventReward from plainObject:', error);
			return new EventReward();
		}
	}

	toPlainObject(): any {
		return {
			id: this.id,
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

	getId(): string {
		return this.id;
	}

	setId(newId: string): string {
		this.id = newId;
		return this.id;
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
