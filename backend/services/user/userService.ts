import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import levelRepository from "@/backend/repositories/level/levelRepository";
import actionHistoryRepository from "@/backend/repositories/user/actionHistoryRepository";
import itemHistoryRepository from "@/backend/repositories/user/itemHistoryRepository";
import userRepository from "@/backend/repositories/user/userRepository";
import LevelSystem, { LevelSystemEntity } from "@/models/level/LevelSystem";
import { ActionHistoryEntity } from "@/models/user/history/actionHistory/ActionHistory";
import { ItemHistoryEntity } from "@/models/user/history/itemHistory/ItemHistory";
import User, { UserEntity } from "@/models/user/User";
import { assert } from "console";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";


/**
 * Inserts a user into the database. Does nothing if a user with the same userId already exists.
 * @param user
 * @param userId
 * @param client
 */
 export async function createUserInDatabase(user: User, userId: string, client?: PoolClient): Promise<boolean> {
	if (user.getUserId() !== userId) {
		console.warn(`UserIds do not match between passed object and firebase. Consider updating the userId to use firebase uid.`);
	}
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			const levelInstance = user.getLevelSystem();
			const actionHistoryInstance = user.getActionHistory();
			const itemHistoryInstance = user.getItemHistory();

			const payload = {
				"queries": [
					{
						"tableName": "users",
						"columnsToWrite": [
							"id", 
							"username", 
							"password_hash", 
							"password_salt", 
							"icon"
						],
						"values": [
							[
								userId,
								user.getUsername(),
								"DEFAULT_PASSWORD_HASH",
								"DEFAULT_PASSWORD_SALT",
								user.getIcon()
							  ]
						],
						"conflictColumns": [
							"id"
						],
						"returnColumns": [
							"id"
						]
					},
					{
						"tableName": "levels",
						"columnsToWrite": [
							"id", 
							"owner_uuid", 
							"owner_uid", 
							"owner_type", 
							"total_xp", 
							"growth_rate"
						],
						"values": [
							[
								levelInstance.getLevelSystemId(),
								null,
								userId,
								"user",
								levelInstance.getTotalExp(),
								levelInstance.getGrowthRate()
							  ]
						],
						"conflictColumns": [
							"owner_type",
							"owner_uid"
						],
						"conflictIndex": "owner_uid",
						"returnColumns": [
							"id"
						]
					}
				]
			};
			const insert_action_history_values: any = [];
			actionHistoryInstance.getAllHistories().forEach((history) => {
				const toInsert = [
					history.getActionHistoryId(),
					userId,
					history.getIdentifier(),
					history.getQuantity()
					]
				insert_action_history_values.push(toInsert);
			})
			if (insert_action_history_values.length > 0) {
				const actionHistoryInsertQuery = {
					"tableName": "action_histories",
					"columnsToWrite": [
						"id", "owner", "identifier", "quantity"
					],
					"values": insert_action_history_values,
					"conflictColumns": [
						"owner",
						"identifier"
					],
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(actionHistoryInsertQuery);
			}
			const insert_item_history_values: any = [];
			itemHistoryInstance.getAllHistories().forEach((history) => {
				const toInsert = [
					history.getItemHistoryId(),
					userId,
					history.getItemData().id,
					history.getQuantity()
					]
				insert_item_history_values.push(toInsert);
			})
			if (insert_item_history_values.length > 0) {
				const itemHistoryInsertQuery = {
					"tableName": "item_histories",
					"columnsToWrite": [
						"id", "owner", "identifier", "quantity"
					],
					"values": insert_item_history_values,
					"conflictColumns": [
						"owner",
						"identifier"
					],
					"returnColumns": [
						"id"
					]
				};
				payload.queries.push(itemHistoryInsertQuery);
			}

			const insertResult = await invokeLambda('garden-insert', payload);
			// Check if result is valid
			if (!insertResult) {
				throw new Error(`Error executing creation of user ${userId}`);
			}
			const userResult = parseRows<string[]>(insertResult[0]);
			const levelResult = parseRows<string[]>(insertResult[1]);
			const actionHistoryResult = insert_action_history_values.length > 0 ? parseRows<string[]>(insertResult[2]) : [];
			const itemHistoryResult = insert_item_history_values.length > 0 ? parseRows<string[]>(insertResult[insertResult.length - 1]) : [];

			// Check for discrepancies
			if (userResult.length !== 1) {
				console.warn(`Expected 1 user to be created, but got ${userResult.length}`);
			}
			if (levelResult.length !== 1) {
				console.warn(`Expected 1 level to be created, but got ${levelResult.length}`);
			}
			if (actionHistoryResult.length !== insert_action_history_values.length) {
				console.warn(`Expected ${insert_action_history_values.length} action history IDs to be returned, but got ${actionHistoryResult.length}`);
			}
			if (itemHistoryResult.length !== insert_item_history_values.length) {
				console.warn(`Expected ${insert_item_history_values.length} item history IDs to be returned, but got ${itemHistoryResult.length}`);
			}
			return true;
		} catch (error) {
			console.error('Error creating user from Lambda:', error);
			throw error;
		}
	} else {
		const userResult = await userRepository.createUser(user, client);
		if (!userResult) {
			throw new Error('There was an error creating the user');
		}

		//Create level (relies on user)
		const levelResult = await levelRepository.createLevelSystem(userResult.id, 'user', user.getLevelSystem(), client);
		if (!levelResult) {
			throw new Error('There was an error creating the level system');
		}

		// Array to store all promises
		const allPromises: Promise<void>[] = [];

		// Create action histories
		const actionHistoryPromises: Promise<void>[] = user.getActionHistory().getAllHistories().map(async (elem) => {
			const result = await actionHistoryRepository.createActionHistory(elem, user.getUserId(), client);
			if (!result) {
				throw new Error(`Error creating action history for user ${user.getUserId()}`);
			}
		});
		allPromises.push(...actionHistoryPromises);

		// Create item histories
		const itemHistoryPromises: Promise<void>[] = user.getItemHistory().getAllHistories().map(async (elem) => {
			const result = await itemHistoryRepository.createItemHistory(elem, user.getUserId(), client);
			if (!result) {
				throw new Error(`Error creating item history for user ${user.getUserId()}`);
			}
		});
		allPromises.push(...itemHistoryPromises);

		// Wait for all promises to resolve
		await Promise.allSettled(allPromises);

		return true;
	}
}


/**
 * Changes the username for the given user id
 * @userId the id of the user to modify
 * @newUsername the new username of the user (maximum 255 characters)
 * @returns a UserEntity with the new username on success (or throws error)
 */
export async function updateUserUsername(userId: string, newUsername: string): Promise<UserEntity> {
	//Can put validation/business logic here
	if (newUsername.length > 255 || newUsername.length === 0) {
		throw new Error(`Invalid new username length`);
	}
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			// Call Lambda function with userId as payload

			// 'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, icon'
			const payload = {
				"queries": [
				  {
					"tableName": "users",
					"values": {
					  "username": newUsername
					},
					"returnColumns": [
					  "id",
					  "username",
					  "icon"
					],
					"conditions": {
					  "id": {
						"operator": "=",
						"value": userId
					  }
					}
				  }
				]
			  }
			const userResult = await invokeLambda('garden-update', payload);
			// Check if result is valid
			if (!userResult) {
				throw new Error(`Could not find user for id ${userId}`);
			}
			console.log(userResult);
			const userEntityResult = parseRows<UserEntity[]>(userResult[0])[0];
			assert(userRepository.validateUserEntity(userEntityResult));
			return userEntityResult;
		} catch (error) {
			console.error('Error updating username from Lambda:', error);
			throw error;
		}
	} else {
		return userRepository.updateUserUsername(userId, newUsername);
	}
}

/**
 * Changes the icon for the given user id
 * @userId the id of the user to modify
 * @newIcon the new icon of the user, as a string referencing the icon name (maximum 50 characters)
 * @returns a UserEntity with the new icon on success (or throws error)
 */
 export async function updateUserIcon(userId: string, newIcon: string): Promise<UserEntity> {
	//Can put validation/business logic here
	if (newIcon.length > 50 || newIcon.length === 0) {
		throw new Error(`Invalid new icon length`);
	}

	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			// Call Lambda function with userId as payload
			// 'UPDATE users SET icon = $1 WHERE id = $2 RETURNING id, username, icon'
			const payload = {
				"queries": [
				  {
					"tableName": "users",
					"values": {
					  "icon": newIcon
					},
					"returnColumns": [
					  "id",
					  "username",
					  "icon"
					],
					"conditions": {
					  "id": {
						"operator": "=",
						"value": userId
					  }
					}
				  }
				]
			  }
			const userResult = await invokeLambda('garden-update', payload);
			// Check if result is valid
			if (!userResult) {
				throw new Error(`Could not find user for id ${userId}`);
			}
			const userEntityResult = parseRows<UserEntity[]>(userResult[0])[0];
			assert(userRepository.validateUserEntity(userEntityResult));
			return userEntityResult;
		} catch (error) {
			console.error('Error updating icon from Lambda:', error);
			throw error;
		}
	} else {
		return userRepository.updateUserIcon(userId, newIcon);
	}
}

/**
 * @returns a user plain object
 */
export async function getUserFromDatabase(userId: string, client?: PoolClient): Promise<any> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			// Call Lambda function with userId as payload
			//SELECT * FROM users WHERE id = $1
			const payload = {
				"queries": [
					{
					"returnColumns": [
						"id",
						"username",
						"icon"
					],
					"tableName": "users",
					"conditions": {
						"id": {
						"operator": "=",
						"value": userId
						}
					},
					"limit": 1
					},
					{
						"returnColumns": [
							"id",
							"total_xp",
							"growth_rate"
						],
						"tableName": "levels",
						"conditions": {
							"owner_uid": {
							"operator": "=",
							"value": userId
							},
							"owner_type": {
								"operator": "=",
								"value": "user"
								}
						},
						"limit": 1
					},
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"quantity"
						],
						"tableName": "action_histories",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1000
					},
					{
						"returnColumns": [
							"id",
							"owner",
							"identifier",
							"quantity"
						],
						"tableName": "item_histories",
						"conditions": {
							"owner": {
								"operator": "=",
								"value": userId
							}
						},
						"limit": 1000
					}
				]
			  }
			const userResult = await invokeLambda('garden-select', payload);
			// Check if result is valid
			if (!userResult) {
				throw new Error(`Could not find user for id ${userId}`);
			}
			const userEntityResult = parseRows<UserEntity[]>(userResult[0])[0];
			assert(userRepository.validateUserEntity(userEntityResult));
			const levelEntityResult = parseRows<LevelSystemEntity[]>(userResult[1])[0];
			assert(levelRepository.validateLevelSystemEntity(levelEntityResult));
			const levelSystemInstance = levelRepository.makeLevelSystemObject(levelEntityResult);
			const actionHistoryEntityListResult = parseRows<ActionHistoryEntity[]>(userResult[2]);
			assert(Array.isArray(actionHistoryEntityListResult));
			const itemHistoryEntityListResult = parseRows<ItemHistoryEntity[]>(userResult[3]);
			assert(Array.isArray(itemHistoryEntityListResult));
			const actionHistories = actionHistoryEntityListResult.map((actionHistoryEntity) => actionHistoryRepository.makeActionHistoryObject(actionHistoryEntity));
			const actionHistoryList = actionHistoryRepository.makeActionHistoryListObject(actionHistories);
			const itemHistories = itemHistoryEntityListResult.map((itemHistoryEntity) => itemHistoryRepository.makeItemHistoryObject(itemHistoryEntity));
			const itemHistoryList = itemHistoryRepository.makeItemHistoryListObject(itemHistories);
			const userObject = userRepository.makeUserObject(userEntityResult, levelSystemInstance, actionHistoryList, itemHistoryList);
			return userObject.toPlainObject();
		} catch (error) {
			console.error('Error fetching user from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {
			//Create user
			const userResult = await userRepository.getUserById(userId);
			// Check if result is valid
			if (!userResult) {
				throw new Error(`Could not find the user for id ${userId}`);
			}
			const levelSystem = await levelRepository.getLevelSystemByOwnerId(userResult.id, "user");
			let levelSystemInstance;
			if (!levelSystem) {
				levelSystemInstance = User.generateDefaultLevelSystem();
			} else {
				levelSystemInstance = levelRepository.makeLevelSystemObject(levelSystem);
			}
			const actionHistoryEntities = await actionHistoryRepository.getActionHistoriesByUserId(userResult.id);
			const actionHistories = actionHistoryEntities.map((actionHistoryEntity) => actionHistoryRepository.makeActionHistoryObject(actionHistoryEntity));
			const actionHistoryList = actionHistoryRepository.makeActionHistoryListObject(actionHistories);
			const itemHistoryEntities = await itemHistoryRepository.getItemHistoriesByUserId(userResult.id);
			const itemHistories = itemHistoryEntities.map((itemHistoryEntity) => itemHistoryRepository.makeItemHistoryObject(itemHistoryEntity));
			const itemHistoryList = itemHistoryRepository.makeItemHistoryListObject(itemHistories);
			const userInstance = userRepository.makeUserObject(userResult, levelSystemInstance, actionHistoryList, itemHistoryList);
	
			return userInstance.toPlainObject();
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchUserFromDatabase', client);
	}
}

/**
 * @returns boolean
 */
export async function userIdExistsInDatabase(userId: string, client?: PoolClient): Promise<boolean> {
	if (process.env.USE_DATABASE === 'LAMBDA') {
		try {
			// Call Lambda function with userId as payload
			//SELECT * FROM users WHERE id = $1
			const payload = {
				"queries": [
					{
					"returnColumns": [
						"id",
						"username",
						"icon"
					],
					"tableName": "users",
					"conditions": {
						"id": {
						"operator": "=",
						"value": userId
						}
					},
					"limit": 1
					}
				]
			  }
			const userResult = await invokeLambda('garden-select', payload);
			// Check if result is valid
			if (!userResult) {
				return false;
			}
			const userEntityResult = parseRows<UserEntity[]>(userResult[0])[0];
			assert(userRepository.validateUserEntity(userEntityResult));
			return true;
		} catch (error) {
			console.error('Error checking userId exists from Lambda:', error);
			throw error;
		}
	} else {
		const innerFunction = async (client: PoolClient) => {
			//Create user
			const userResult = await userRepository.getUserEntityById(userId);
			// Check if result is valid
			if (!userResult) {
				return false;
			}
			return true;
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'userIdExistsInDatabase', client);
	}
}