import LevelSystem from "../level/LevelSystem";

class User {

	private username: string;
	private icon: string; //indexes into a list of icons by name
	private level: LevelSystem;

	constructor(username: string, icon: string, level: LevelSystem = new LevelSystem()) {
		this.username = username;
		this.icon = icon;
		this.level = level;
	}

	static fromPlainObject(plainObject: any) {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for User');
            }
			const { username, icon, level } = plainObject;
			// Perform additional type checks if necessary
			if (typeof username !== 'string') {
				throw new Error('Invalid username property in plainObject for User');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for User');
			}
			const hydratedLevel = LevelSystem.fromPlainObject(level);
			return new User(username, icon, hydratedLevel);
			
		} catch (err) {
			console.error('Error creating User from plainObject:', err);
            return new User("Error User", "error");
		}
	}

	toPlainObject(): any {
		return {
			username: this.username,
			icon: this.icon,
			level: this.level.toPlainObject()
		};
	}

	getUsername(): string {
		return this.username;
	}

	setUsername(newUsername: string): void {
		this.username = newUsername;
	}

	getIcon(): string {
		return this.icon;
	}

	setIcon(newIcon: string): void {
		this.icon = newIcon;
	}

	/**
	 * @returns the level of the user
	 */
	 getLevel(): number {
		return this.level.getLevel();
	}

	/**
	 * @returns the total xp needed to level up
	 */
	getExpToLevelUp(): number {
		return this.level.getExpToLevelUp();
	}

	/**
	 * @returns the user's current xp
	 */
	getCurrentExp(): number {
		return this.level.getCurrentExp();
	}

	/**
	 * @returns the growth rate, higher = faster
	 */
	getGrowthRate(): number {
		return this.level.getGrowthRate();
	}

	/**
	 * @param exp the quantity of xp to add
	 */
	addExp(exp: number) {
		return this.level.addExperience(exp);
	}

}
export default User;