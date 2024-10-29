export class Account {

	cloudSave: boolean;

	constructor(cloudSave: boolean) {
		this.cloudSave = cloudSave;
	}

	static fromPlainObject(plainObject: any) {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for Account');
            }
			const { cloudSave } = plainObject;
			// Perform additional type checks if necessary
			if (typeof cloudSave !== 'boolean') {
				throw new Error('Invalid cloudSave property in plainObject for Account');
			}
			return new Account(cloudSave);
			
		} catch (err) {
			console.error('Error creating Account from plainObject:', err);
            return new Account(false);
		}
	}

	toPlainObject(): any {
		return {
			cloudSave: this.cloudSave
		};
	}

}