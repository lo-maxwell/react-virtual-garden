export class AccountSettings {
	guestMode: boolean;
	displayEmojiIcons: boolean;

	constructor(guestMode: boolean = false, displayEmojiIcons: boolean = true) {
		this.guestMode = guestMode;
		this.displayEmojiIcons = displayEmojiIcons;
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
		let { guestMode, displayEmojiIcons } = plainObject;
		// Use default if invalid or missing
		if (typeof guestMode !== 'boolean') {
			guestMode = defaultSettings.guestMode;
		}
		if (typeof displayEmojiIcons !== 'boolean') {
			displayEmojiIcons = defaultSettings.displayEmojiIcons;
		}
		return new AccountSettings(guestMode, displayEmojiIcons);
			
	}

	toPlainObject(): any {
		return {
			guestMode: this.guestMode,
			displayEmojiIcons: this.displayEmojiIcons,
		};
	}
}