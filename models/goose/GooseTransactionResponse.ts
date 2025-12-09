import { CustomResponse } from "../utility/CustomResponse";

export class GooseTransactionResponse extends CustomResponse {
	constructor(payload: any = null, messages: string[] = []) {
		super(payload, messages);
	}
}