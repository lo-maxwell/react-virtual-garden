import { CustomResponse } from "@/models/utility/CustomResponse";


export class ToolTransactionResponse<T = null> extends CustomResponse<T>  {
	// TODO: make payload only accept tool items?
	constructor(payload: T | null = null, messages: string[] = []) {
		super(payload, messages);
	}
}