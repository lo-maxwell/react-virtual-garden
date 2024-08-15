import LevelSystem from "../level/LevelSystem";
import { ActionHistoryList } from "./history/ActionHistoryList";
import ItemHistory from "./history/itemHistory/ItemHistory";
import { ItemHistoryList } from "./history/ItemHistoryList";

class User {

	private username: string;
	private icon: string; //indexes into a list of icons by name
	private level: LevelSystem;
	private itemHistory: ItemHistoryList;
	private actionHistory: ActionHistoryList;

	constructor(username: string, icon: string, level: LevelSystem = new LevelSystem(), itemHistory: ItemHistoryList = new ItemHistoryList, actionHistory: ActionHistoryList = new ActionHistoryList()) {
		this.username = username;
		this.icon = icon;
		this.level = level;
		this.itemHistory = itemHistory;
		this.actionHistory = actionHistory;
	}

	static fromPlainObject(plainObject: any) {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for User');
            }
			const { username, icon, level, itemHistory, actionHistory } = plainObject;
			// Perform additional type checks if necessary
			if (typeof username !== 'string') {
				throw new Error('Invalid username property in plainObject for User');
			}
			if (typeof icon !== 'string') {
				throw new Error('Invalid icon property in plainObject for User');
			}
			const hydratedLevel = LevelSystem.fromPlainObject(level);
			const hydratedItemHistory = ItemHistoryList.fromPlainObject(itemHistory);
			const hydratedActionHistory = ActionHistoryList.fromPlainObject(actionHistory);
			return new User(username, icon, hydratedLevel, hydratedItemHistory, hydratedActionHistory);
			
		} catch (err) {
			console.error('Error creating User from plainObject:', err);
            return new User("Error User", "error");
		}
	}

	toPlainObject(): any {
		return {
			username: this.username,
			icon: this.icon,
			level: this.level.toPlainObject(),
			itemHistory: this.itemHistory.toPlainObject(),
			actionHistory: this.actionHistory.toPlainObject(),
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

	getItemHistory() {
		return this.itemHistory;
	}

	getActionHistory() {
		return this.actionHistory;
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
	 * @exp the quantity of xp to add
	 */
	addExp(exp: number) {
		return this.level.addExperience(exp);
	}



}
export default User;