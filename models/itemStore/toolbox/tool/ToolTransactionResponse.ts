import { CustomResponse } from "@/models/utility/CustomResponse";


export class ToolTransactionResponse extends CustomResponse {
	// TODO: make payload only accept tool items?
	constructor(payload: any = null, messages: string[] = []) {
		super(payload, messages);
	}
}