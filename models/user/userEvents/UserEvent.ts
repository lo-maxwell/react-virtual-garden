import { UserEventType, UserEventTypes } from "./UserEventTypes";

export interface UserEventEntity {
	user: string;
	event_type: string;
	last_occurrence: Date;
	streak: number;
}

export class UserEvent {

	private user: string;
	private event_type: UserEventType;
	private last_occurrence: Date;
	private streak: number;

	constructor(user: string, event_type: UserEventType, last_occurrence: Date = new Date(Date.now()), streak: number = 0) {
		this.user = user;
		this.event_type = event_type;
		this.last_occurrence = last_occurrence;
		this.streak = streak;
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
			const { user, event_type, last_occurrence, streak } = plainObject;
			// Perform additional type checks if necessary
			if (typeof user !== 'string') {
				throw new Error('Invalid user property in plainObject for UserEvent');
			}

			if (!this.isUserEventType(event_type)) {
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
		
			return new UserEvent(user, event_type, date, streak);
		} catch (err) {
			console.error(plainObject);
			console.error('Error creating UserEvent from plainObject:', err);
            return this.generateErrorUserEvent("-1");
		}
	}

	toPlainObject(): any {
		return {
			user: this.user,
			event_type: this.event_type,
			last_occurrence: this.last_occurrence,
			streak: this.streak,
		};
	}

	getUser(): string {
		return this.user;
	}

	getEventType(): UserEventType {
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

}