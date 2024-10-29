import { pool, query } from "@/backend/connection/db";
import Icon, { IconEntity } from "@/models/user/icons/Icon";

class IconRepository {

	makeIconObject(iconType: IconEntity): Icon {
		if (!iconType || (typeof iconType.name !== 'string') || (typeof iconType.icon !== 'string')) {
			throw new Error(`Error creating Icon from IconEntity (${iconType.name}, ${iconType.icon})`);
		}
		return new Icon(iconType.name, iconType.icon);
	}

	/**
	 * Returns a list of all icons from the icons table.
	 * May throw errors if the query is misshapped.
	 * @returns Icon[]
	 */
	async getAllIcons(): Promise<Icon[]> {
		const result = await query<IconEntity>('SELECT * FROM icons', []);
		if (!result || result.rows.length === 0) return [];
		const toReturn: Icon[] = result.rows.map((row) => this.makeIconObject(row));
		return toReturn;
	}

	async getIconById(id: number): Promise<Icon | null> {
		const result = await query<IconEntity>('SELECT * FROM icons WHERE id = $1', [id]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const instance = this.makeIconObject(result.rows[0]);
		return instance;
	}

	async getIconByName(searchName: string): Promise<Icon | null> {
		const result = await query<IconEntity>('SELECT * FROM icons WHERE name = $1', [searchName]);
		// If no rows are returned, return null
		if (!result || result.rows.length === 0) return null;
		// Return the first item found
		const instance = this.makeIconObject(result.rows[0]);
		return instance;
	}

	async createIcon(inputName: string, inputIcon: string): Promise<Icon> {
		const result = await query<IconEntity>(
			'INSERT INTO icons (name, icon) VALUES ($1, $2) RETURNING *',
			[inputName, inputIcon]
			);

		// Check if result is valid
		if (!result || result.rows.length === 0) {
			throw new Error('There was an error creating the icon');
		}

		// Return the created icon as an instance
		const instance = this.makeIconObject(result.rows[0]);
		return instance;

		
		const client = await pool.connect(); // Get a client from the pool

		try {
			await client.query('BEGIN'); // Start the transaction

			const result = await client.query<IconEntity>(
			'INSERT INTO icons (name, icon) VALUES ($1, $2) RETURNING *',
			[inputName, inputIcon]
			);

			await client.query('COMMIT'); // Commit the transaction

			// Check if result is valid
			if (!result || result.rows.length === 0) {
			throw new Error('There was an error creating the icon');
			}

			// Return the created icon as an instance
			const instance = this.makeIconObject(result.rows[0]);
			return instance;
		} catch (error) {
			await client.query('ROLLBACK'); // Rollback the transaction on error
			console.error('Error creating icon:', error);
			throw error; // Rethrow the error for higher-level handling
		} finally {
			client.release(); // Release the client back to the pool
		}
	}
}

const iconRepository = new IconRepository();
export default iconRepository;