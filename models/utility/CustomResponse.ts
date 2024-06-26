export class CustomResponse {
	payload: any;
	messages: string[];
	constructor(payload: any = null, messages: string[] = []) {
		this.payload = payload;
		this.messages = messages;
	}

	isSuccessful() {
		return this.messages.length == 0;
	}

	addErrorMessage(msg: string) {
		this.messages.push(msg);
	}

	printErrorMessages() {
		this.messages.forEach((element, index) => {
			console.log(element);
		})
	}
}