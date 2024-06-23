import { CustomResponse } from "../utility/CustomResponse";

export class GardenTransactionResponse extends CustomResponse {
	// TODO: make payload only accept placed items?
	constructor(payload: any = null, messages: string[] = []) {
		super(payload, messages);
	}
}