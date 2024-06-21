import { CustomResponse } from "../utility/CustomResponse";

export class InventoryTransactionResponse extends CustomResponse {
	constructor(payload: any = null, messages: string[] = []) {
		super(payload, messages);
	}
}