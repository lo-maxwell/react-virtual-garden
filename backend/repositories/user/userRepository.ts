import { pool, query } from "@/backend/connection/db";
import { invokeLambda } from "@/backend/lambda/invokeLambda";
import Toolbox from "@/models/garden/tools/Toolbox";
import LevelSystem from "@/models/level/LevelSystem";
import { ActionHistoryList } from "@/models/user/history/ActionHistoryList";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import User, { UserEntity } from "@/models/user/User";
import assert from "assert";
import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import levelRepository from "../level/levelRepository";
import actionHistoryRepository from "./actionHistoryRepository";
import itemHistoryRepository from "./itemHistoryRepository";

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

	async makeUserObject(userEntity: UserEntity): Promise<User> {
		assert(this.validateUserEntity(userEntity), 'UserEntity validation failed');
		//TODO: Fetches all relevant data from database and uses it to construct user

		// Gather all promises
		const levelPromise = levelRepository.getLevelSystemByOwnerId(userEntity.id, "user");
		const itemHistoryPromise = itemHistoryRepository.makeItemHistoryListObject(userEntity.id);
		const actionHistoryPromise = actionHistoryRepository.makeActionHistoryListObject(userEntity.id);

		// Wait for all promises to resolve
		const [levelResult, itemHistory, actionHistory] = await Promise.all([levelPromise, itemHistoryPromise, actionHistoryPromise]);

		let levelInstance;
		if (!levelResult) {
			//Creates a new level system in database if not found
			const levelSystem = await levelRepository.createLevelSystem(userEntity.id, 'user', new LevelSystem(uuidv4()));
			if (!levelSystem) {
				throw new Error(`Invalid creation of levelSystem for user ${userEntity.id}`);
			}
			levelInstance = levelRepository.makeLevelSystemObject(levelSystem);
		} else {
			levelInstance = levelRepository.makeLevelSystemObject(levelResult);
		} 
		

		let toolbox = new Toolbox();
		return new User(userEntity.id, userEntity.username, userEntity.icon, levelInstance, itemHistory, actionHistory, toolbox);
	}

	/**
	 * Returns a list of all users from the users table.
	 * This is very expensive.
	 * May throw errors if the query is misshapped.
	 * @returns User[]
	 */
	async getAllUsers(): Promise<User[]> {
		const result = await query<UserEntity>('SELECT * FROM users', []);
		if (!result || result.rows.length === 0) return [];
		const toReturn: User[] = await Promise.all(result.rows.map((row) => this.makeUserObject(row)));
		return toReturn;
	}

	async getUserById(id: string): Promise<User | null> {
		const result = await query<UserEntity>('SELECT * FROM users WHERE id = $1', [id]);
        // If no rows are returned, return null
        if (!result || result.rows.length === 0) return null;
        // Return the first item found
        const instance = this.makeUserObject(result.rows[0]);
        return instance;
	}

	async getUserByIdWithLambda(id: string): Promise<User | null> {
		try {
			// Call Lambda function with userId as payload
			const result = await invokeLambda<UserEntity>('test-db-lambda', { userId: id });
			
			// If no result, return null
			if (!result) return null;
			// Transform the data using existing makeUserObject method
			const instance = this.makeUserObject(result);
			return instance;
		} catch (error) {
			console.error('Error fetching user from Lambda:', error);
			throw error;
		}
	}

	async getUsersByName(searchName: string): Promise<User[]> {
		const result = await query<UserEntity>('SELECT * FROM users WHERE username = $1', [searchName]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return [];
		const toReturn: User[] = await Promise.all(result.rows.map((row) => this.makeUserObject(row)));
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
	 * Begins a transaction if there is not already one. Creates a new row in the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
	 * On error, rolls back.
	 * @user the User to add
	 * @client the pool client that this is nested within, or null if it should create its own transaction.
	 * @returns the UserEntity if success, null if failure (or throws error)
	 */
	async createUser(user: User, client?: PoolClient): Promise<UserEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			// Check if the user already exists
			const existingUserResult = await client.query<UserEntity>(
				'SELECT id, username, icon FROM users WHERE id = $1',
				[user.getUserId()]
			);

			if (existingUserResult.rows.length > 0) {
				//User already exists
				console.warn(`User already exists with this ID: ${existingUserResult.rows[0].id}`);
				return existingUserResult.rows[0];
				// return this.makeUserObject(existingUserResult.rows[0]); 
			}

			const userResult = await query<UserEntity>(
				'INSERT INTO users (id, username, password_hash, password_salt, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[user.getUserId(), user.getUsername(), 'default password hash', 'default password salt', user.getIcon()]
				);

			// Check if result is valid
			if (!userResult || userResult.rows.length === 0) {
				throw new Error('There was an error creating the user');
			}

			// Return the created User as an instance
			// const instance = makeUserObject(userResult.rows[0]);
			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}
			return userResult.rows[0];
			// return user;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating user:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
	}

	async createOrUpdateUser(user: User, client?: PoolClient): Promise<UserEntity> {
		const shouldReleaseClient = !client;
		if (!client) {
			client = await pool.connect();
		}
		try {
			if (shouldReleaseClient) {
				await client.query('BEGIN'); // Start the transaction
			}

			// Check if the user already exists
			const existingUserResult = await client.query<{id: string}>(
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

			if (shouldReleaseClient) {
				await client.query('COMMIT'); // Rollback the transaction on error
			}

			return result;
		} catch (error) {
			if (shouldReleaseClient) {
				await client.query('ROLLBACK'); // Rollback the transaction on error
			}
			console.error('Error creating user:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			if (shouldReleaseClient) {
				client.release(); // Release the client back to the pool
			}
		}
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

	async updateUserIconWithLambda(id: string, newIcon: string): Promise<UserEntity | null> {
		try {
			// Call Lambda function with userId as payload
			const result = await invokeLambda<UserEntity>('SAMFunction3', { userId: id, newIcon: newIcon });
			
			// If no result, return null
			if (!result) return null;
			return result;
		} catch (error) {
			console.error('Error fetching user from Lambda:', error);
			throw error;
		}
	}
}

const userRepository = new UserRepository();
export default userRepository;
