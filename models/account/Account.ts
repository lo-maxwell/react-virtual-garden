export class Account {

	guestMode: boolean;

	constructor(guestMode: boolean) {
		this.guestMode = guestMode;
	}

	static fromPlainObject(plainObject: any) {
		// Validate plainObject structure
		if (!plainObject || typeof plainObject !== 'object') {
			throw new Error('Invalid plainObject structure for Account');
		}
		const { guestMode } = plainObject;
		// Perform additional type checks if necessary
		if (typeof guestMode !== 'boolean') {
			throw new Error('Invalid guestMode property in plainObject for Account');
		}
		return new Account(guestMode);
			
	}

	toPlainObject(): any {
		return {
			guestMode: this.guestMode
		};
	}

}