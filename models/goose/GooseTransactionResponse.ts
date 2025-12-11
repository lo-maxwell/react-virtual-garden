import { CustomResponse } from "../utility/CustomResponse";

export class GooseTransactionResponse<T = null> extends CustomResponse<T> {
	constructor(payload: T | null = null, messages: string[] = []) {
		super(payload, messages);
	}
}