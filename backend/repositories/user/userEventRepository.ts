import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import { EventReward, EventRewardEntity, EventRewardItemEntity } from "@/models/events/EventReward";
import Toolbox from "@/models/itemStore/toolbox/tool/Toolbox";
import LevelSystem from "@/models/level/LevelSystem";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import User from "@/models/user/User";
import { UserEvent, UserEventEntity } from "@/models/user/userEvents/UserEvent";
import { UserEventType } from "@/models/user/userEvents/UserEventTypes";
import assert from "assert";
import { PoolClient } from 'pg';
import eventRewardRepository from "../events/eventRewardRepository";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { v4 as uuidv4 } from 'uuid';
import eventRewardItemRepository from "../events/eventRewardItemRepository";

class UserEventRepository {

	/**
	 * Ensures that the object is of type UserEventEntity, ie. that it contains a user, event type, last occurrence, and streak
	 */
	validateUserEventEntity(userEventEntity: any): boolean {
		if (!userEventEntity || (typeof userEventEntity.id !== 'string') || (typeof userEventEntity.owner !== 'string') || !UserEvent.isUserEventType(userEventEntity.event_type) || (typeof userEventEntity.streak !== 'number')) {
			console.error(userEventEntity);
			throw new Error(`Invalid types while creating UserEvent from UserEventEntity`);
		}
		// Ensure created_at is a valid date string or Date object
		if (!userEventEntity.created_at) {
			console.error(userEventEntity);
			throw new Error(`created_at is missing from UserEventEntity`);
		}
		const createdAtDate = new Date(userEventEntity.created_at);
		if (isNaN(createdAtDate.getTime())) {
			throw new Error(`Invalid created_at date in UserEventEntity: ${userEventEntity.created_at}`);
		}
		return true;
	}

	/**
	 * Creates a UserEvent object from a UserEventEntity and optionally an EventRewardEntity and InventoryItemList.
	 * @param userEventEntity The entity containing user event data.
	 * @param eventRewardEntity Optional entity containing event reward data.
	 * @param rewardItems Optional list of inventory items associated with the reward.
	 * @returns A UserEvent object.
	 */
	makeUserEventObject(userEventEntity: UserEventEntity, eventRewardEntity?: EventRewardEntity, rewardItems?: InventoryItemList): UserEvent {
		assert(this.validateUserEventEntity(userEventEntity), 'UserEventEntity validation failed');
		let eventRewardInstance: EventReward | null = null;
		if (eventRewardEntity) {
			eventRewardInstance = eventRewardRepository.makeEventRewardObject(userEventEntity, eventRewardEntity, rewardItems);
		}
		
		const createdAtDate = new Date(userEventEntity.created_at);
		return new UserEvent(userEventEntity.id, userEventEntity.owner, userEventEntity.event_type as UserEventType, createdAtDate, userEventEntity.streak, eventRewardInstance);
	}

	makeUserEventMapObject(userEventEntityList: UserEventEntity[], eventRewardEntityList?: EventRewardEntity[], eventRewardItemEntityList?: EventRewardItemEntity[]): Map<string, UserEvent> {
		const userEventMap = new Map<string, UserEvent>();
		userEventEntityList.forEach(userEventEntity => {
			this.validateUserEventEntity(userEventEntity);

			const eventType = userEventEntity.event_type;
			const existingEvent = userEventMap.get(eventType);

			// If there's an existing event and the new event is NOT more recent, skip processing
			if (existingEvent && new Date(userEventEntity.created_at).getTime() <= existingEvent.getCreatedAt().getTime()) {
				return; // Skip to the next entity
			}

			// If we reach here, either there's no existing event, or the new event is more recent
			let correspondingEventRewardEntity: EventRewardEntity | undefined = undefined;
			let rewardItemsForEvent: InventoryItemList | undefined = undefined;

			// Find the corresponding eventRewardEntity
			if (eventRewardEntityList) {
				correspondingEventRewardEntity = eventRewardEntityList.find(
					(rewardEntity) => rewardEntity.owner === userEventEntity.id
				);
			}

			// If an eventRewardEntity is found, find its items and make the InventoryItemList
			if (correspondingEventRewardEntity && eventRewardItemEntityList) {
				const filteredEventRewardItems = eventRewardItemEntityList.filter(
					(itemEntity) => itemEntity.owner === correspondingEventRewardEntity!.id
				);
				rewardItemsForEvent = eventRewardItemRepository.makeEventRewardItemObjectBatch(filteredEventRewardItems);
			}

			// Now, create the final UserEvent object with all reward details
			const finalUserEvent = this.makeUserEventObject(
				userEventEntity,
				correspondingEventRewardEntity,
				rewardItemsForEvent
			);

			userEventMap.set(finalUserEvent.getEventType(), finalUserEvent);
		});
		return userEventMap;
	}

	/**
	 * Returns a list of all userEvents from the users table.
	 * May throw errors if the query is misshapped.
	 * @returns UserEventEntity[]
	 */
	async getAllUserEvents(): Promise<UserEventEntity[]> {
		const result = await query<UserEventEntity>('SELECT * FROM user_events', []);
		if (!result || result.rows.length === 0) return [];
		const toReturn: UserEventEntity[] = await Promise.all(result.rows.map((row) => row));
		return toReturn;
	}

	async getUserEventsByUserId(userId: string): Promise<UserEventEntity[]> {
		const result = await query<UserEventEntity>('SELECT * FROM user_events WHERE user = $1', [userId]);
		if (!result || result.rows.length === 0) return [];
		const toReturn: UserEventEntity[] = await Promise.all(result.rows.map((row) => row));
		return toReturn;
	}

	async getUserEventByType(eventType: UserEventType): Promise<UserEventEntity[]> {
		const result = await query<UserEventEntity>('SELECT * FROM user_events WHERE event_type = $1', [eventType]);
		if (!result || result.rows.length === 0) return [];
		const toReturn: UserEventEntity[] = await Promise.all(result.rows.map((row) => row));
		return toReturn;
	}

	async getUserEvent(userId: string, eventType: UserEventType): Promise<UserEventEntity | null> {
		const result = await query<UserEventEntity>('SELECT * FROM user_events WHERE owner = $1 && event_type = $2', [userId, eventType]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
	}

	//TODO: The following functions are untested. We currently use aws lambda to run all database calls.
	/**
	 * Begins a transaction if there is not already one. Creates a new row in the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
	 * On error, rolls back.
	 * @userEvent the UserEvent to add
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns the UserEventEntity if success, null if failure (or throws error)
	 */
	async createUserEvent(userEvent: UserEvent, client?: PoolClient): Promise<UserEventEntity> {
		const innerFunction = async (client: PoolClient) => {
			// Check if the user already exists
			const existingUserEventResult = await this.getUserEvent(userEvent.getUser(), userEvent.getEventType());

			if (existingUserEventResult) {
				// User already exists
				console.warn(`UserEvent already exists for owner: ${existingUserEventResult.owner} and event type: ${existingUserEventResult.event_type}`);
				return existingUserEventResult;
			}

			const userEventResult = await client.query<UserEventEntity>(
				'INSERT INTO user_events (owner, event_type, streak, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
				[userEvent.getUser(), userEvent.getEventType(), userEvent.getStreak(), userEvent.getCreatedAt()]
			);

			// Check if result is valid
			if (!userEventResult || userEventResult.rows.length === 0) {
				throw new Error('There was an error creating the userEvent');
			}

			// Return the created UserEvent as an instance
			return userEventResult.rows[0];
		};

		// Use the transactionWrapper to handle the transaction
		return await transactionWrapper(innerFunction, 'creating userEvent', client);
	}

	async createOrUpdateUserEvent(userEvent: UserEvent, client?: PoolClient): Promise<UserEventEntity> {
		const innerFunction = async (client: PoolClient) => {
			// Check if the user already exists
			const existingUserEventResult = await this.getUserEvent(userEvent.getUser(), userEvent.getEventType());

			let result;

			if (existingUserEventResult) {
				// User already exists
				result = await this.updateUserEvent(userEvent);
				if (!result) {
					throw new Error(`Error updating userEvent for owner: ${existingUserEventResult.owner} and event type: ${existingUserEventResult.event_type}`);
				}
			} else {
				result = await this.createUserEvent(userEvent, client);
				if (!result) {
					throw new Error(`Error creating userEvent for owner: ${userEvent.getUser()} and event type: ${userEvent.getEventType()}`);
				}
			}

			return result;
		};

		// Use the transactionWrapper to handle the transaction
		return await transactionWrapper(innerFunction, 'creating or updating userEvent', client);
	}

	/**
	 * Changes all data fields for a specified userEvent (lastOccurrence, streak)
	 * DOES NOT VALIDATE DATA, ENSURE THAT DATE/STREAK ARE CORRECT
	 * @userEvent the userEvent to update
	 * @returns a UserEventEntity with the new data on success (or throws error)
	 */
	async updateUserEvent(userEvent: UserEvent): Promise<UserEventEntity> {
		const userEventResult = await query<UserEventEntity>(
			'UPDATE user_events SET streak = $1, created_at = $2 WHERE id = $3 RETURNING *',
			[userEvent.getStreak(), userEvent.getCreatedAt(), userEvent.getId()]
		);

		// Check if result is valid
		if (!userEventResult || userEventResult.rows.length === 0) {
			throw new Error(`Could not find userEvent for user: ${userEvent.getUser()} and event type: ${userEvent.getEventType()}`);
		}

		const updatedRow = userEventResult.rows[0];
		return updatedRow;
	}

}

const userEventRepository = new UserEventRepository();
export default userEventRepository;
