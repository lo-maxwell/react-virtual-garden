import { CustomResponse } from "./CustomResponse";

export class BooleanResponse extends CustomResponse {
	// TODO: make payload only accept history items?
	payload: boolean ;
	constructor(payload: boolean = false, messages: string[] = []) {
		super(payload, messages);
		this.payload = payload;
	}
}