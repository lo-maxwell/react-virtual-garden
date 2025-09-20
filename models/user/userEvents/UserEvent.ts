import { EventReward } from "@/models/events/EventReward";
import { UserEventType, UserEventTypes } from "./UserEventTypes";
import { v4 as uuidv4 } from 'uuid';

export interface UserEventEntity {
	id: string;
	owner: string;
	event_type: UserEventType;
	streak: number;
	created_at: Date;
}

export class UserEvent {

	private id: string;
	private user: string;
	private event_type: UserEventType;
	private created_at: Date;
	private streak: number;
	private event_reward: EventReward;

	constructor(id: string | null = null, user: string, event_type: UserEventType, created_at: Date = new Date(Date.now()), streak: number = 0, event_reward: EventReward | null = null) {
		this.id = id || uuidv4();
		this.user = user;
		this.event_type = event_type;
		this.created_at = created_at;
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
		const errorEvent = new UserEvent(uuidv4(), user, "ERROR");
		return errorEvent;
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
			const { id, user, event_type, created_at, streak, event_reward } = plainObject;
			// Perform additional type checks if necessary
			if (typeof user !== 'string') {
				throw new Error('Invalid user property in plainObject for UserEvent');
			}

			if (!UserEvent.isUserEventType(event_type)) {
				throw new Error('Invalid event_type property');
			}
	
			const date =
				created_at instanceof Date
				? created_at
				: new Date(created_at);
	
			if (isNaN(date.getTime())) {
				throw new Error('Invalid created_at property');
			}
	
			if (typeof streak !== 'number') {
				throw new Error('Invalid streak property');
			}

			const hydratedEventReward = EventReward.fromPlainObject(event_reward);
	
			const instance = new UserEvent(id, user, event_type, date, streak, hydratedEventReward);
			return instance;
		} catch (err) {
			console.error(plainObject);
			console.error('Error creating UserEvent from plainObject:', err);
            return UserEvent.generateErrorUserEvent("-1");
		}
	}

	toPlainObject(): any {
		return {
			id: this.id,
			user: this.user,
			event_type: this.event_type,
			created_at: this.created_at.toISOString(),
			streak: this.streak,
			event_reward: this.event_reward.toPlainObject()
		}
	}

	getId(): string {
		return this.id;
	}

	getUser(): string {
		return this.user;
	}

	getEventType(): UserEventType {
		return this.event_type;
	}

	getStreak(): number {
		return this.streak;
	}

	getEventReward(): EventReward {
		return this.event_reward;
	}

	setId(id: string) {
		this.id = id;
	}

	setUser(user: string) {
		this.user = user;
	}

	setEventType(event_type: UserEventType) {
		this.event_type = event_type;
	}

	setStreak(streak: number) {
		this.streak = streak;
	}

	setEventReward(event_reward: EventReward) {
		this.event_reward = event_reward;
	}

	getCreatedAt(): Date {
		return this.created_at;
	}

	setCreatedAt(created_at: Date) {
		this.created_at = created_at;
	}
}