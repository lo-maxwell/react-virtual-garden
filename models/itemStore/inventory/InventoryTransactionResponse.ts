import { CustomResponse } from "../../utility/CustomResponse";

export class InventoryTransactionResponse extends CustomResponse {
	// TODO: make payload only accept inventory items?
	constructor(payload: any = null, messages: string[] = []) {
		super(payload, messages);
	}
}