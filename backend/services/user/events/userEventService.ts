import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import userEventRepository from "@/backend/repositories/user/userEventRepository";
import { UserEvent, UserEventEntity } from "@/models/user/userEvents/UserEvent";
import assert from "assert";
import { PoolClient } from "pg";
import { transactionWrapper } from "../../utility/utility";

/**
 * Inserts a userEvent into the database. Does nothing if a userEvent with the same user and event_type already exists.
 * @param userEvent
 * @param client
 */
 export async function createUserEventInDatabase(userEvent: UserEvent, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const payload = {
				"queries": [
					{
						"tableName": "user_events",
						"columnsToWrite": [
							"user", 
							"event_type", 
							"last_occurrence", 
							"streak"
						],
						"values": [
							[
								userEvent.getUser(),
								userEvent.getEventType(),
								userEvent.getLastOccurrence(),
								userEvent.getStreak(),
							  ]
						],
						"conflictColumns": [
							"user",
							"event_type"
						],
						"returnColumns": [
							"user", 
							"event_type", 
							"last_occurrence", 
							"streak"
						]
					}
				]
			};

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing creation of userEvent with user: ${userEvent.getUser()} and event type: ${userEvent.getEventType()}`);
			}
			const userEventResult = parseRows<string[]>(insertResult[0]);

			// Check for discrepancies
			if (userEventResult.length !== 1) {
				console.warn(`Expected 1 userEvent to be created, but got ${userEventResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error creating userEvent from Lambda:', error);
			throw error;
		}
	} else {
		const userEventResult = await userEventRepository.createUserEvent(userEvent, client);
		if (!userEventResult) {
			throw new Error('There was an error creating the userEvent');
		}
		return true;
	}
}

/**
 * Updates the userEvent in the database, or creates new entries if they do not exist
 * Overwrites the existing streak
 * @param userEvent
 * @param client
 */
 export async function upsertUserEventInDatabase(userEvent: UserEvent, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const payload = {
				"queries": [
					{
						"tableName": "user_events",
						"columnsToWrite": [
							"user", 
							"event_type", 
							"last_occurrence", 
							"streak"
						],
						"values": [
							[
								userEvent.getUser(),
								userEvent.getEventType(),
								userEvent.getLastOccurrence(),
								userEvent.getStreak(),
							  ]
						],
						"conflictColumns": [
							"user",
							"event_type"
						],
						"updateQuery": {
							"values": {
								"user": userEvent.getUser(),
								"event_type": userEvent.getEventType(),
								"last_occurrence": userEvent.getLastOccurrence(),
								"streak": userEvent.getStreak(),
							},
							"conditions": {}
						},
						"returnColumns": [
							"user", 
							"event_type", 
							"last_occurrence", 
							"streak"
						]
					}
				]
			};

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing upsert of userEvent with user: ${userEvent.getUser()} and event type: ${userEvent.getEventType()}`);
			}
			const userEventResult = parseRows<string[]>(insertResult[0]);
			// Check for discrepancies
			if (userEventResult.length !== 1) {
				console.warn(`Expected 1 userEvent to be upserted, but got ${userEventResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error upserting userEvent from Lambda:', error);
			throw error;
		}
	} else {
		const userEventResult = await userEventRepository.createOrUpdateUserEvent(userEvent, client);
		if (!userEventResult) {
			throw new Error('There was an error upserting the userEvent');
		}
		return true;
	}
}

/**
 * @returns a userEventEntity, or null
 */
 export async function getUserEventEntityFromDatabase(userEvent: UserEvent, client?: PoolClient): Promise<UserEventEntity | null> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			// Call Lambda function with userEvent as payload
			//SELECT * FROM users WHERE id = $1
			const payload = {
				"queries": [
					{
						"returnColumns": [
							"user", 
							"event_type", 
							"last_occurrence", 
							"streak"
						],
						"tableName": "user_events",
						"conditions": {
							"user": {
								"operator": "=",
								"value": userEvent.getUser()
							},
							"event_type": {
								"operator": "=",
								"value": userEvent.getEventType()
							}
						}
					}
				]
			  }
			const userEventResult = await invokeLambda('garden-select', payload);
			// Check if result is valid
			if (!userEventResult) {
				throw new Error(`Could not find userEvent with user: ${userEvent.getUser()} and event type: ${userEvent.getEventType()}`);
			}
			const userEventEntityResult = parseRows<UserEventEntity[]>(userEventResult[0]);
			assert(userEventRepository.validateUserEventEntity(userEventEntityResult));
			if (userEventEntityResult.length > 1) {
				console.warn(`Expected 1 userEvent to be fetched, but got ${userEventResult.length}`);
			}
			if (userEventEntityResult.length == 0) return null;
			return userEventEntityResult[0];
		} catch (error) {
			console.error('Error fetching userEventEntity from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {
			//Create user
			const userEventResult = await userEventRepository.getUserEvent(userEvent.getUser(), userEvent.getEventType());
			// Check if result is valid
			if (!userEventResult) {
				throw new Error(`Could not find userEvent with user: ${userEvent.getUser()} and event type: ${userEvent.getEventType()}`);
			}
			return userEventResult;
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchUserEventEntityFromDatabase', client);
	}
}

export async function claimDailyReward() {

}