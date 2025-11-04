export class AccountSettings {
	guestMode: boolean;
	displayEmojiIcons: boolean;
	confirmDeletePlants: boolean;
	confirmPlantAll: boolean;
	confirmHarvestAll: boolean;
	confirmPickupAll: boolean;

	constructor(guestMode: boolean = false, displayEmojiIcons: boolean = true, confirmPlantAll: boolean = true, confirmHarvestAll: boolean = true, confirmPickupAll: boolean = true, confirmDeletePlants: boolean = true) {
		this.guestMode = guestMode;
		this.displayEmojiIcons = displayEmojiIcons;
		this.confirmDeletePlants = confirmDeletePlants;
		this.confirmPlantAll = confirmPlantAll;
		this.confirmHarvestAll = confirmHarvestAll;
		this.confirmPickupAll = confirmPickupAll;
	}

	static getDefaultSettings(): AccountSettings {
		return new AccountSettings();
	}

	static fromPlainObject(plainObject: any) {
		// Validate plainObject structure
		if (!plainObject || typeof plainObject !== 'object') {
			throw new Error('Invalid plainObject structure for Settings');
		}
		const defaultSettings = AccountSettings.getDefaultSettings();
		let { guestMode, displayEmojiIcons, confirmDeletePlants, confirmPlantAll, confirmPickupAll, confirmHarvestAll } = plainObject;
		// Use default if invalid or missing
		if (typeof guestMode !== 'boolean') {
			guestMode = defaultSettings.guestMode;
		}
		if (typeof displayEmojiIcons !== 'boolean') {
			displayEmojiIcons = defaultSettings.displayEmojiIcons;
		}
		if (typeof confirmDeletePlants !== 'boolean') {
			confirmDeletePlants = defaultSettings.confirmDeletePlants;
		}
		if (typeof confirmPlantAll !== 'boolean') {
			confirmPlantAll = defaultSettings.confirmPlantAll;
		}
		if (typeof confirmHarvestAll !== 'boolean') {
			confirmHarvestAll = defaultSettings.confirmHarvestAll;
		}
		if (typeof confirmPickupAll !== 'boolean') {
			confirmPickupAll = defaultSettings.confirmPickupAll;
		}
		return new AccountSettings(guestMode, displayEmojiIcons, confirmPlantAll, confirmHarvestAll, confirmPickupAll, confirmDeletePlants);
			
	}

	toPlainObject(): any {
		return {
			guestMode: this.guestMode,
			displayEmojiIcons: this.displayEmojiIcons,
			confirmDeletePlants: this.confirmDeletePlants,
			confirmPlantAll: this.confirmPlantAll,
			confirmHarvestAll: this.confirmHarvestAll,
			confirmPickupAll: this.confirmPickupAll,
		};
	}
}