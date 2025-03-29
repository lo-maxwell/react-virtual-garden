import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import userRepository from "@/backend/repositories/user/userRepository";
import { UserEntity } from "@/models/user/User";
import { assert } from "console";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";

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
			const userEntityResult = parseRows<UserEntity[]>(userResult)[0];
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
			const userEntityResult = parseRows<UserEntity[]>(userResult)[0];
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
					}
				]
			  }
			const userResult = await invokeLambda('garden-select', payload);
			// Check if result is valid
			if (!userResult) {
				throw new Error(`Could not find user for id ${userId}`);
			}
			const userEntityResult = parseRows<UserEntity[]>(userResult)[0];
			assert(userRepository.validateUserEntity(userEntityResult));
			const userObject = await userRepository.makeUserObject(userEntityResult);
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
	
			return userResult.toPlainObject();
		}
		// Call transactionWrapper with inner function and description
		return transactionWrapper(innerFunction, 'fetchUserFromDatabase', client);
	}
}

/**
 * Testing purposes only
 * @returns a user plain object
 */
export async function getUserFromDatabaseWithLambda(userId: string): Promise<any> {
	const userResult = await userRepository.getUserByIdWithLambda(userId);
	// Check if result is valid
	if (!userResult) {
		throw new Error(`Could not find the user for id ${userId}`);
	}

	return userResult.toPlainObject();
}

/**
 * Testing purposes only
 * @returns a user plain object
 */
 export async function updateIconWithLambda(userId: string, newIcon: string): Promise<any> {
	const userResult = await userRepository.updateUserIconWithLambda(userId, newIcon);
	// Check if result is valid
	if (!userResult) {
		throw new Error(`Could not find the user for id ${userId}`);
	}

	return userResult;
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
			const userEntityResult = parseRows<UserEntity[]>(userResult)[0];
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