import { pool } from "@/backend/connection/db";
import gardenRepository from "@/backend/repositories/garden/gardenRepository";
import levelRepository from "@/backend/repositories/level/levelRepository";
import { Garden } from "@/models/garden/Garden";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";

/**
 * Attempts to add a row (expand the column size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function addGardenRow(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
	// Define the inner function that handles the core logic inside the transaction
	const innerFunction = async (client: PoolClient): Promise<boolean> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			gardenRepository.getGardenById(gardenId),
			levelRepository.getLevelSystemByOwnerId(userId, 'user')
		]);

		// Destructure the results for easier access
		const [gardenResult, levelSystemResult] = results;

		// Check for errors in each promise and handle accordingly
		if (gardenResult.status === 'rejected' || gardenResult.value === null) {
			throw new Error(`Could not find garden matching id ${gardenId}`);
		}
		if (gardenResult.value.owner !== userId) {
			throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
		}
		if (levelSystemResult.status === 'rejected' || levelSystemResult.value === null) {
			throw new Error(`Could not find levelsystem matching user ${userId}`);
		}

		// Extract the resolved values
		const gardenEntity = gardenResult.value;
		const levelSystemEntity = levelSystemResult.value;

		// Business logic to check if a row can be added
		if (!Garden.canAddRow(gardenEntity.rows, levelSystemEntity.level)) {
			throw new Error(`Cannot add row to garden`);
		}
		
		// Update the garden size
		await gardenRepository.updateGardenSize(gardenId, 1, 0, client);

		return true;
	};

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'addGardenRow', client);
}


/**
 * Attempts to remove a row (shrink the column size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function removeGardenRow(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
	// Define the inner function that handles the core logic inside the transaction
	const innerFunction = async (client: PoolClient): Promise<boolean> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			gardenRepository.getGardenById(gardenId)
		]);

		// Destructure the results for easier access
		const [gardenResult] = results;

		// Check for errors in each promise and handle accordingly
		if (gardenResult.status === 'rejected' || gardenResult.value === null) {
			throw new Error(`Could not find garden matching id ${gardenId}`);
		}
		if (gardenResult.value.owner !== userId) {
			throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
		}

		// Extract the resolved values
		const gardenEntity = gardenResult.value;

		// Business logic to check if a row can be removed
		if (!Garden.canRemoveRow(gardenEntity.rows)) {
			throw new Error(`Cannot remove row from garden`);
		}
		
		// Update the garden size
		await gardenRepository.updateGardenSize(gardenId, -1, 0, client);

		return true;
	};

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'RemoveGardenRow', client);
}

/**
 * Attempts to add a column (expand the row size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function addGardenColumn(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
	// Define the inner function that handles the core logic inside the transaction
	const innerFunction = async (client: PoolClient): Promise<boolean> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			gardenRepository.getGardenById(gardenId),
			levelRepository.getLevelSystemByOwnerId(userId, 'user')
		]);

		// Destructure the results for easier access
		const [gardenResult, levelSystemResult] = results;

		// Check for errors in each promise and handle accordingly
		if (gardenResult.status === 'rejected' || gardenResult.value === null) {
			throw new Error(`Could not find garden matching id ${gardenId}`);
		}
		if (gardenResult.value.owner !== userId) {
			throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
		}
		if (levelSystemResult.status === 'rejected' || levelSystemResult.value === null) {
			throw new Error(`Could not find levelsystem matching user ${userId}`);
		}

		// Extract the resolved values
		const gardenEntity = gardenResult.value;
		const levelSystemEntity = levelSystemResult.value;

		// Business logic to check if a column can be added
		if (!Garden.canAddColumn(gardenEntity.columns, levelSystemEntity.level)) {
			throw new Error(`Cannot add column to garden`);
		}
		
		// Update the garden size
		await gardenRepository.updateGardenSize(gardenId, 0, 1, client);

		return true;
	};

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'addGardenColumn', client);
}

/**
 * Attempts to remove a column (shrink the row size) of the garden
 * @userId the id of the owner of the garden, used for checking level
 * @gardenId the id of the garden
 * @client if null, creates a new client
 * @returns an object containing the modified level system, plot, and inventoryItem on success (or throws error)
 */
export async function removeGardenColumn(userId: string, gardenId: string, client?: PoolClient): Promise<boolean> {
	// Define the inner function that handles the core logic inside the transaction
	const innerFunction = async (client: PoolClient): Promise<boolean> => {
		// Grab all relevant objects concurrently
		const results = await Promise.allSettled([
			gardenRepository.getGardenById(gardenId)
		]);

		// Destructure the results for easier access
		const [gardenResult] = results;

		// Check for errors in each promise and handle accordingly
		if (gardenResult.status === 'rejected' || gardenResult.value === null) {
			throw new Error(`Could not find garden matching id ${gardenId}`);
		}
		if (gardenResult.value.owner !== userId) {
			throw new Error(`Garden ${gardenId} is not owned by user ${userId}`);
		}

		// Extract the resolved values
		const gardenEntity = gardenResult.value;

		// Business logic to check if a column can be removed
		if (!Garden.canRemoveColumn(gardenEntity.columns)) {
			throw new Error(`Cannot remove column from garden`);
		}
		
		// Update the garden size
		await gardenRepository.updateGardenSize(gardenId, 0, -1, client);

		return true;
	};

	// Call the transactionWrapper with the innerFunction and appropriate arguments
	return transactionWrapper(innerFunction, 'RemoveGardenColumn', client);
}

export async function plantAll() {
	
}

export async function harvestAll() {

}