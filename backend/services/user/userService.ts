import userRepository from "@/backend/repositories/user/userRepository";
import { UserEntity } from "@/models/user/User";
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
	return userRepository.updateUserUsername(userId, newUsername);
}

/**
 * Changes the icon for the given user id
 * @userId the id of the user to modify
 * @newIcon the new icon of the user (maximum 50 characters)
 * @returns a UserEntity with the new icon on success (or throws error)
 */
 export async function updateUserIcon(userId: string, newIcon: string): Promise<UserEntity> {
	//Can put validation/business logic here
	if (newIcon.length > 50 || newIcon.length === 0) {
		throw new Error(`Invalid new icon length`);
	}
	return userRepository.updateUserIcon(userId, newIcon);
}

/**
 * @returns a user plain object
 */
export async function getUserFromDatabase(userId: string, client?: PoolClient): Promise<any> {
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