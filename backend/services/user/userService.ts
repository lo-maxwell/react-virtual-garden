import userRepository from "@/backend/repositories/user/userRepository";
import { UserEntity } from "@/models/user/User";

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