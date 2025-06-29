import { InventoryItemList } from "../InventoryItemList";

export interface StocklistInterface {
	id: string;
	name: string;
	items: InventoryItemList;
  }