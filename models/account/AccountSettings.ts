export class AccountSettings {
	guestMode: boolean;
	displayEmojiIcons: boolean;
	confirmDeletePlants: boolean;

	constructor(guestMode: boolean = false, displayEmojiIcons: boolean = true, confirmDeletePlants: boolean = true) {
		this.guestMode = guestMode;
		this.displayEmojiIcons = displayEmojiIcons;
		this.confirmDeletePlants = confirmDeletePlants;
	}

	static getDefaultSettings(): AccountSettings {
		let defaultGuestMode = false;
		return new AccountSettings(defaultGuestMode);
	}

	static fromPlainObject(plainObject: any) {
		// Validate plainObject structure
		if (!plainObject || typeof plainObject !== 'object') {
			throw new Error('Invalid plainObject structure for Settings');
		}
		const defaultSettings = AccountSettings.getDefaultSettings();
		let { guestMode, displayEmojiIcons, confirmDeletePlants } = plainObject;
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
		return new AccountSettings(guestMode, displayEmojiIcons, confirmDeletePlants);
			
	}

	toPlainObject(): any {
		return {
			guestMode: this.guestMode,
			displayEmojiIcons: this.displayEmojiIcons,
			confirmDeletePlants: this.confirmDeletePlants,
		};
	}
}