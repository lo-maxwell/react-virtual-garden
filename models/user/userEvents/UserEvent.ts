import { EventReward } from "@/models/events/EventReward";
import { UserEventType, UserEventTypes } from "./UserEventTypes";

export interface UserEventEntity {
	id: number;
	owner: string;
	event_type: UserEventType;
	last_occurrence: Date;
	streak: number;
}

export class UserEvent {

	private user: string;
	private event_type: UserEventType;
	private last_occurrence: Date;
	private streak: number;
	private event_reward: EventReward;

	constructor(user: string, event_type: UserEventType, last_occurrence: Date = new Date(Date.now()), streak: number = 0, event_reward: EventReward | null = null) {
		this.user = user;
		this.event_type = event_type;
		this.last_occurrence = last_occurrence;
		this.streak = streak;
		this.event_reward = event_reward || new EventReward({
			eventType: event_type || UserEventTypes.ERROR.name,
			userId: user,
			inventoryId: "error",
			streak,
			gold: 0,
			message: ""
		});
	}

	static generateErrorUserEvent(user: string): UserEvent {
		return new UserEvent(user, "ERROR");
	}

	static isUserEventType(value: any): value is UserEventType {
		return Object.values(UserEventTypes).some(event => event.name === value);
	  }

	static fromPlainObject(plainObject: any) {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for UserEvent');
            }
			const { user, event_type, last_occurrence, streak, event_reward } = plainObject;
			// Perform additional type checks if necessary
			if (typeof user !== 'string') {
				throw new Error('Invalid user property in plainObject for UserEvent');
			}

			if (!UserEvent.isUserEventType(event_type)) {
				throw new Error('Invalid event_type property');
			}
	
			const date =
				last_occurrence instanceof Date
				? last_occurrence
				: new Date(last_occurrence);
	
			if (isNaN(date.getTime())) {
				throw new Error('Invalid last_occurrence property');
			}
	
			if (typeof streak !== 'number') {
				throw new Error('Invalid streak property');
			}

			const hydratedEventReward = EventReward.fromPlainObject(event_reward);
	
			return new UserEvent(user, event_type, date, streak, hydratedEventReward);
		} catch (err) {
			console.error(plainObject);
			console.error('Error creating UserEvent from plainObject:', err);
            return UserEvent.generateErrorUserEvent("-1");
		}
	}

	toPlainObject(): any {
		return {
			user: this.user,
			event_type: this.event_type,
			last_occurrence: this.last_occurrence,
			streak: this.streak,
			event_reward: this.event_reward.toPlainObject()
		};
	}

	getUser(): string {
		return this.user;
	}

	getEventType(): UserEventType {
		return this.event_type;
	}

	setEventType(newEventType: UserEventType): UserEventType {
		this.event_type = newEventType;
		return this.event_type;
	}

	getLastOccurrence(): Date {
		return this.last_occurrence;
	}

	setLastOccurence(newTimestamp: Date = new Date(Date.now())): Date {
		this.last_occurrence = newTimestamp;
		return this.last_occurrence;
	}

	getStreak(): number {
		return this.streak;
	}

	setStreak(newQuantity: number): number {
		this.streak = Math.max(0, newQuantity);
		return this.streak;
	}

	getEventReward(): EventReward {
		return this.event_reward;
	}

	/** 
	 * For overwriting the entire reward. Generally, use getEventReward() and modify that object instead.
	 */
	setEventReward(newEventReward: EventReward): EventReward {
		this.event_reward = newEventReward;
		return this.event_reward;
	}

	/**
	 * Returns the time passed since the last occurrence of the event in milliseconds
	 * @param currentTime - The current time to compare against the last occurrence
	 * @returns The time passed since the last occurrence in milliseconds
	 */
	eventTimePassed(currentTime: Date = new Date(Date.now())): number {
		return (currentTime.getTime() - this.last_occurrence.getTime());
	}

}