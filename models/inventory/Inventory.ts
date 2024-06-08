import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemList } from "./ItemList";

export class Inventory {
	userId: string;
	gold: number;
	items: ItemList;
	
	constructor(userId: string, gold: number = 0, items: ItemList) {
		this.userId = userId;
		this.gold = gold;
		this.items = items;
	}

	//TODO: Implement crud for inventory, pass along to items

}