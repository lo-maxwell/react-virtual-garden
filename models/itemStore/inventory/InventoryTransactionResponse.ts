import { CustomResponse } from "../../utility/CustomResponse";

export class InventoryTransactionResponse<T = null> extends CustomResponse<T> {
	// TODO: make payload only accept inventory items?
	constructor(payload: T | null = null, messages: string[] = []) {
		super(payload, messages);
	}
}