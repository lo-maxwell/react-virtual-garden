import { CustomResponse } from "../../../utility/CustomResponse";
import ItemHistory from "./ItemHistory";

export class ItemHistoryTransactionResponse extends CustomResponse {
	// TODO: make payload only accept history items?
	payload: ItemHistory | null;
	constructor(payload: ItemHistory | null = null, messages: string[] = []) {
		super(payload, messages);
		this.payload = payload;
	}
}