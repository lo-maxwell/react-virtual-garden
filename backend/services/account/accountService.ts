
import { pool } from "@/backend/connection/db";
import gardenRepository from "@/backend/repositories/garden/gardenRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepsitory";
import storeRepository from "@/backend/repositories/itemStore/store/storeRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import userRepository from "@/backend/repositories/user/userRepository";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { PoolClient } from "pg";

/**
 * Begins a transaction if there is not already one. Creates a new row in the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
 * If the object already exists in the database (with the corresponding id), does nothing.
 * On error, rolls back.
 * @user the User to add
 * @inventory the User's inventory
 * @store the store associated with the User
 * @garden the garden associated with the User
 * @client the pool client that this is nested within, or null if it should create its own transaction.
 * @returns the User if success, null if failure (or throws error)
 */
 export async function createAccountInDatabase(user: User, inventory: Inventory, store: Store, garden: Garden, client?: PoolClient): Promise<boolean | null> {
	const shouldReleaseClient = !client;
	if (!client) {
		client = await pool.connect();
	}
	try {
		if (shouldReleaseClient) {
			await client.query('BEGIN'); // Start the transaction
		}

		//Create user
		const userResult = await userRepository.createUser(user, client);
		// Check if result is valid
		if (!userResult) {
			throw new Error('There was an error creating the user');
		}
		
		//Create level (relies on user)
		const levelResult = await levelRepository.createLevelSystem(user.getUserId(), 'user', user.getLevelSystem(), client);
		// Check if result is valid
		if (!levelResult) {
			throw new Error('There was an error creating the level system');
		}

		//Create garden
		const gardenResult = await gardenRepository.createGarden(user.getUserId(), garden, client);
		// Check if result is valid
		if (!gardenResult) {
			throw new Error('There was an error creating the garden');
		}

		//Create inventory
		const inventoryResult = await inventoryRepository.createInventory(user.getUserId(), inventory, client);
		// Check if result is valid
		if (!inventoryResult) {
			throw new Error('There was an error creating the inventory');
		}

		//Create inventory items in inventoryService

		//Create store
		const storeResult = await storeRepository.createStore(user.getUserId(), store, client);
		// Check if result is valid
		if (!storeResult) {
			throw new Error('There was an error creating the store');
		}

		//Create store items in storeService

		// Return the created User as an instance
		// const instance = makeUserObject(userResult.rows[0]);
		if (shouldReleaseClient) {
			await client.query('COMMIT'); // Rollback the transaction on error
		}
		return true;
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