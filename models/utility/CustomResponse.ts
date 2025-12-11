export class CustomResponse<T = null> {
	payload: T | null;
	messages: string[];
	constructor(payload: T | null = null, messages: string[] = []) {
		this.payload = payload;
		this.messages = messages;
	}

	isSuccessful(): this is CustomResponse<NonNullable<T>> & { payload: NonNullable<T> } {
		return this.messages.length === 0 && this.payload !== null;
	}

	addErrorMessage(msg: string) {
		this.messages.push(msg);
	}

	addErrorMessages(msgs: string[]) {
		msgs.forEach((msg) => {
			this.messages.push(msg);
		})
	}

	printErrorMessages() {
		this.messages.forEach((element, index) => {
			console.log(element);
		})
	}
}