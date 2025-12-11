import { CustomResponse } from "../../../utility/CustomResponse";
import ItemHistory from "./ItemHistory";

export class ItemHistoryTransactionResponse extends CustomResponse<ItemHistory | null>  {
	constructor(payload: ItemHistory | null = null, messages: string[] = []) {
		super(payload, messages);
	}
}