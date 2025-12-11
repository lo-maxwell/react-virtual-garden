import { CustomResponse } from "../utility/CustomResponse";

export class GardenTransactionResponse<T = null> extends CustomResponse<T>  {
	// TODO: make payload only accept placed items?
	constructor(payload: T | null = null, messages: string[] = []) {
		super(payload, messages);
	}
}