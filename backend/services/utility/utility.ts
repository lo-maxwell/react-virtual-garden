import { pool } from "@/backend/connection/db";
import { PoolClient } from "pg";

/**
 * Wraps a function in a transaction.
 * @innerFunction function to run
 * @functionDescription string describing the function, for error messages
 * @client if null, creates new client
 */
export async function transactionWrapper(innerFunction: (client: PoolClient) => Promise<any>, functionDescription: string, client?: PoolClient) {
	const shouldReleaseClient = !client;
	if (!client) {
		client = await pool.connect();
	}
	try {
		if (shouldReleaseClient) {
			await client.query('BEGIN'); // Start the transaction
			// Set transaction-level timeout to 10 seconds
			await client.query("SET statement_timeout = '10s'");
		}
		
		const result = await innerFunction(client);

		if (shouldReleaseClient) {
			await client.query('COMMIT'); // Rollback the transaction on error
		}
		return result;
	} catch (error) {
		if (shouldReleaseClient) {
			await client.query('ROLLBACK'); // Rollback the transaction on error
		}
		console.error(`Error ${functionDescription}:`, error);
		throw error; // Rethrow the error for higher-level handling
	} finally {
		if (shouldReleaseClient) {
			client.release(); // Release the client back to the pool
		}
	}
}