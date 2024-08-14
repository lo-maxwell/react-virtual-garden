import { ItemTemplate } from "@/models/items/templates/models/ItemTemplate";
import { ItemHistoryTransactionResponse } from "./ItemHistoryTransactionResponse";
abstract class ItemHistory {
	protected itemData: ItemTemplate;
	
	constructor(item: ItemTemplate) {
		this.itemData = item;
	}

	abstract toPlainObject(): any;

	abstract getItemData(): ItemTemplate;

	abstract combineHistory(history: ItemHistory): ItemHistoryTransactionResponse;
}

export default ItemHistory;