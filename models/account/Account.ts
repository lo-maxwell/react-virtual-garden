import { AccountSettings } from "./AccountSettings";

export class Account {

	settings: AccountSettings

	constructor(settings: AccountSettings = AccountSettings.getDefaultSettings()) {
		this.settings = settings;
	}

	static fromPlainObject(plainObject: any) {
		try {
			// Validate plainObject structure
			if (!plainObject || typeof plainObject !== 'object') {
				throw new Error('Invalid plainObject structure for Account');
			}
			const { settings } = plainObject;
			// Perform additional type checks if necessary
			if (!settings || typeof settings !== 'object') {
				throw new Error('Invalid settings property in plainObject for Account');
			}
			const settingsInstance = AccountSettings.fromPlainObject(settings);
			return new Account(settingsInstance);
		} catch (error) {
			return new Account(AccountSettings.getDefaultSettings());
		}
			
	}

	toPlainObject(): any {
		return {
			settings: this.settings.toPlainObject(),
		};
	}

}