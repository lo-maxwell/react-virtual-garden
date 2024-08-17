import ItemStoreComponent from "@/components/itemStore/itemStore";
import { ItemSubtypes } from "../items/ItemTypes";
import { PlacedItem } from "../items/placedItems/PlacedItem";
import { PlantTemplate } from "../items/templates/models/PlantTemplate";
import LevelSystem from "../level/LevelSystem";
import { BooleanResponse } from "../utility/BooleanResponse";
import { actionHistoryFactory } from "./history/actionHistory/ActionHistoryFactory";
import { actionHistoryRepository } from "./history/actionHistory/ActionHistoryRepository";
import { ActionHistoryList } from "./history/ActionHistoryList";
import ItemHistory from "./history/itemHistory/ItemHistory";
import { PlantHistory } from "./history/itemHistory/PlantHistory";
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

	/**
	 * Updates this user's itemHistory and actionHistory following the harvest of an item.
	 * @item the item that was harvested
	 * @returns Response containing true or an error message on failure
	 */
	updateHarvestHistory(item: PlacedItem): BooleanResponse {
		const response = new BooleanResponse();
		if (item.itemData.subtype !== ItemSubtypes.PLANT.name) {
			response.addErrorMessage(`Error updating history: attempting to harvest item of type ${item.itemData.subtype}`);
			return response;
		}
		const itemHistory = new PlantHistory(item.itemData as PlantTemplate, 1);
		this.itemHistory.addItemHistory(itemHistory);
		const harvestAllHistory = actionHistoryFactory.createActionHistoryByIdentifiers(item.itemData.subtype, 'all', 'harvested', 1);
		const harvestCategoryHistory = actionHistoryFactory.createActionHistoryByIdentifiers(item.itemData.subtype, item.itemData.category, 'harvested', 1);
		if (harvestAllHistory) {
			this.actionHistory.addActionHistory(harvestAllHistory);
			response.payload = true;
		} else {
			//probably impossible to reach, would only occur if allHistory doesn't exist, which requires modification of histories.json
			response.addErrorMessage(`Error updating history: could not find all action history`);
		}

		if (harvestCategoryHistory) {
			this.actionHistory.addActionHistory(harvestCategoryHistory);
			response.payload = true;
		} else {
			response.addErrorMessage(`Error updating history: could not find action history for item ${item.itemData.name}`);
		}
		
		return response;
	}


}
export default User;