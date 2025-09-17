import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import Toolbox from "@/models/itemStore/toolbox/tool/Toolbox";
import LevelSystem from "@/models/level/LevelSystem";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import User, { UserEntity } from "@/models/user/User";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import assert from "assert";
import { PoolClient } from 'pg';

class UserRepository {

	/**
	 * Ensures that the object is of type UserEntity, ie. that it contains an id, username, and icon field
	 */
	validateUserEntity(userEntity: any): boolean {
		if (!userEntity || (typeof userEntity.id !== 'string') || (typeof userEntity.username !== 'string') || (typeof userEntity.icon !== 'string')) {
			console.error(userEntity);
			throw new Error(`Invalid types while creating User from UserEntity`);
		}
		return true;
	}

	makeUserObject(userEntity: UserEntity, levelSystem: LevelSystem, actionHistoryList: ActionHistoryList, itemHistoryList: ItemHistoryList, toolbox: Toolbox, userEvents: Map<string, UserEvent>): User {
		assert(this.validateUserEntity(userEntity), 'UserEntity validation failed');

		return new User(userEntity.id, userEntity.username, userEntity.icon, levelSystem, itemHistoryList, actionHistoryList, toolbox, userEvents);
	}

	/**
	 * Returns a list of all users from the users table.
	 * May throw errors if the query is misshapped.
	 * @returns UserEntity[]
	 */
	async getAllUsers(): Promise<UserEntity[]> {
		const result = await query<UserEntity>('SELECT * FROM users', []);
		if (!result || result.rows.length === 0) return [];
		const toReturn: UserEntity[] = await Promise.all(result.rows.map((row) => row));
		return toReturn;
	}

	async getUserById(id: string): Promise<UserEntity | null> {
		const result = await query<UserEntity>('SELECT * FROM users WHERE id = $1', [id]);
        // If no rows are returned, return null
        if (!result || result.rows.length === 0) return null;
        // Return the first item found
        const instance = result.rows[0];
        return instance;
	}

	async getUsersByName(searchName: string): Promise<UserEntity[]> {
		const result = await query<UserEntity>('SELECT * FROM users WHERE username = $1', [searchName]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		const toReturn: UserEntity[] = await Promise.all(result.rows.map((row) => row));
		return toReturn;
	}

	async getUserEntityById(id: string): Promise<UserEntity | null> {
		const result = await query<UserEntity>('SELECT * FROM users WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		return result.rows[0];
	}

	/**
	 * TODO: This might be broken if we use non firebase uid for userId
	 * Begins a transaction if there is not already one. Creates a new row in the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
	 * On error, rolls back.
	 * @user the User to add
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns the UserEntity if success, null if failure (or throws error)
	 */
	async createUser(user: User, client?: PoolClient): Promise<UserEntity> {
		const innerFunction = async (client: PoolClient) => {
			// Check if the user already exists
			const existingUserResult = await client.query<UserEntity>(
				'SELECT id, username, icon FROM users WHERE id = $1',
				[user.getUserId()]
			);

			if (existingUserResult.rows.length > 0) {
				// User already exists
				console.warn(`User already exists with this ID: ${existingUserResult.rows[0].id}`);
				return existingUserResult.rows[0];
			}

			const userResult = await client.query<UserEntity>(
				'INSERT INTO users (id, username, password_hash, password_salt, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[user.getUserId(), user.getUsername(), 'default password hash', 'default password salt', user.getIcon()]
			);

			// Check if result is valid
			if (!userResult || userResult.rows.length === 0) {
				throw new Error('There was an error creating the user');
			}

			// Return the created User as an instance
			return userResult.rows[0];
		};

		// Use the transactionWrapper to handle the transaction
		return await transactionWrapper(innerFunction, 'creating user', client);
	}

	async createOrUpdateUser(user: User, client?: PoolClient): Promise<UserEntity> {
		const innerFunction = async (client: PoolClient) => {
			// Check if the user already exists
			const existingUserResult = await client.query<{ id: string }>(
				'SELECT id FROM users WHERE id = $1',
				[user.getUserId()]
			);

			let result;

			if (existingUserResult.rows.length > 0) {
				// User already exists
				result = await this.updateEntireUser(user);
				if (!result) {
					throw new Error(`Error updating user with id ${user.getUserId()}`);
				}
			} else {
				result = await this.createUser(user, client);
				if (!result) {
					throw new Error(`Error creating user with id ${user.getUserId()}`);
				}
			}

			return result;
		};

		// Use the transactionWrapper to handle the transaction
		return await transactionWrapper(innerFunction, 'creating or updating user', client);
	}

	/**
	 * Changes all data fields for a specified user (username, icon)
	 * @user the user to update
	 * @returns a UserEntity with the new data on success (or throws error)
	 */
	async updateEntireUser(user: User): Promise<UserEntity> {
		const userResult = await query<UserEntity>(
			'UPDATE users SET username = $1, icon = $2 WHERE id = $3 RETURNING id, username, icon',
			[user.getUsername(), user.getIcon(), user.getUserId()]
			);

		// Check if result is valid
		if (!userResult || userResult.rows.length === 0) {
			throw new Error(`Could not find user for id ${user.getUserId()}`);
		}

		const updatedRow = userResult.rows[0];
		return updatedRow;
	}

	/**
	 * Changes the username for the given user id
	 * @userId the id of the user to modify
	 * @newUsername the new username of the user (maximum 255 characters)
	 * @returns a UserEntity with the new username on success (or throws error)
	 */
	async updateUserUsername(userId: string, newUsername: string): Promise<UserEntity> {
		const userResult = await query<UserEntity>(
			'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, icon',
			[newUsername, userId]
			);

		// Check if result is valid
		if (!userResult || userResult.rows.length === 0) {
			throw new Error(`Could not find user for id ${userId}`);
		}

		const updatedRow = userResult.rows[0];
		return updatedRow;
	}


	/**
	 * Changes the icon for the given user id. Does not verify that the icon exists.
	 * @userId the id of the user to modify
	 * @newIcon the new icon of the user (maximum 50 characters)
	 * @returns a UserEntity with the new icon on success (or throws error)
	 */
	async updateUserIcon(userId: string, newIcon: string): Promise<UserEntity> {
		const userResult = await query<UserEntity>(
			'UPDATE users SET icon = $1 WHERE id = $2 RETURNING id, username, icon',
			[newIcon, userId]
			);

		// Check if result is valid
		if (!userResult || userResult.rows.length === 0) {
			throw new Error(`Could not find user for id ${userId}`);
		}

		const updatedRow = userResult.rows[0];
		return updatedRow;
	}
}

const userRepository = new UserRepository();
export default userRepository;
