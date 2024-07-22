import { ItemList } from "../ItemList";
import { InventoryItem } from "../../items/inventoryItems/InventoryItem";
import { ItemStore } from "../ItemStore";
import { ItemTemplate } from "@/models/items/ItemTemplate";
import { Inventory } from "../inventory/Inventory";
import { InventoryTransactionResponse } from "../inventory/InventoryTransactionResponse";

export class Store extends ItemStore {
	private id: number;
	private storeName: string;
	private buyMultiplier: number;
	private sellMultiplier: number;
	private stockList: ItemList;

	constructor(id: number, name: string, buyMultiplier: number = 2, sellMultiplier: number = 1, items: ItemList = new ItemList(), stockList: ItemList = new ItemList()) {
		super(items);
		this.id = id;
		this.storeName = name;
		this.buyMultiplier = buyMultiplier;
		this.sellMultiplier = sellMultiplier;
		this.stockList = stockList;
	}

	static fromPlainObject(plainObject: any): Store {
		const { id, storeName, buyMultiplier, sellMultiplier, stockList, items } = plainObject;
		let rehydratedItemList = ItemList.fromPlainObject(items);
		if (rehydratedItemList == null) rehydratedItemList = new ItemList();
		let rehydratedStockList = ItemList.fromPlainObject(stockList);
		if (rehydratedStockList == null) rehydratedStockList = new ItemList();

		return new Store(id, storeName, buyMultiplier, sellMultiplier, rehydratedItemList, rehydratedStockList);
	}

	/**
	 * @returns the storeId of the store.
	 */
	getStoreId(): number {
		return this.id;
	}

	/**
	 * @returns the display name of the store.
	 */
	getStoreName(): string {
		return this.storeName;
	}

	/**
	 * @returns the cost multiplier of the store, as a float.
	 */
	getBuyMultiplier(): number {
		return this.buyMultiplier;
	}

	/**
	 * @param multiplier - the new multiplier
	 */
	setBuyMultiplier(multiplier: number): void {
		this.buyMultiplier = multiplier;
	}

	/**
	 * @returns the cost multiplier of the store, as a float.
	 */
	getSellMultiplier(): number {
		return this.sellMultiplier;
	}

	/**
	 * @param multiplier - the new multiplier
	 */
	setSellMultiplier(multiplier: number): void {
		this.sellMultiplier = multiplier;
	}

	/**
	 * @returns the stock list of the store
	 */
	getStockList(): ItemList {
		return this.stockList;
	}

	/**
	 * @param stockList the stock list of the store
	 */
	setStockList(stockList: ItemList): void {
		this.stockList = stockList;
	}

	// Calculate the price to buy an item from the store
	getBuyPrice(item: InventoryItem): number {
		return item.itemData.basePrice * this.buyMultiplier;
	}
	
	// Calculate the price to sell an item to the store
	getSellPrice(item: InventoryItem): number {
		return item.itemData.basePrice * this.sellMultiplier;
	}

	/**
     * Spends gold to add items to inventory. Fails if there is not enough gold.
	 * @param inventory - The inventory that is spending gold and gaining items
     * @param item - The item to add, identified by InventoryItem or ItemTemplate.
	 * @param quantity - Amount of item being purchased.
     * @returns InventoryTransactionResponse containing the following object or an error message.
	 * {finalGold: number,
	 *  storeItem: InventoryItem,
	 *  purchasedItem: InventoryItem}
     */
	 buyItemFromStore(inventory: Inventory, item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}
		//verify store has enough quantity
		const getItemResponse = this.getItem(item);
		if (!getItemResponse.isSuccessful()) return getItemResponse;
		const toBuy = getItemResponse.payload;
		if (toBuy.quantity < quantity) {
			response.addErrorMessage(`Invalid quantity: store has ${toBuy.quantity} but buying ${quantity}`);
			return response;
		}
		//add item to inventory and remove gold
		const buyItemResponse = inventory.buyItem(toBuy, this.buyMultiplier, quantity);
		if (!buyItemResponse.isSuccessful()) return buyItemResponse;
		//remove item from store inventory
		const decreaseStockResponse = this.trashItem(toBuy, quantity);
		if (!decreaseStockResponse.isSuccessful()) return decreaseStockResponse;
		//format payload
		response.payload = {
			finalGold: buyItemResponse.payload.finalGold,
			storeItem: decreaseStockResponse.payload,
			purchasedItem: buyItemResponse.payload.purchasedItem
		}
		return response;
	 }
	
	/**
     * Sells items for gold.
	 * @param inventory - The inventory that is selling items and gaining gold
     * @param item - The item to sell, identified by InventoryItem or ItemTemplate.
	 * @param quantity - Amount of item being sold
     * @returns InventoryTransactionResponse containing the following object or an error message.
	 * {finalGold: number,
	 *  storeItem: InventoryItem,
	 *  soldItem: InventoryItem}
     */
 	sellItemToStore(inventory: Inventory, item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}
		//verify inventory has enough quantity
		const getItemResponse = inventory.getItem(item);
		
		if (!getItemResponse.isSuccessful()) return getItemResponse;
		const toSell = getItemResponse.payload;
		if (toSell.quantity < quantity) {
			response.addErrorMessage(`Invalid quantity: inventory has ${toSell.quantity} but selling ${quantity}`);
			return response;
		}
		//remove item from inventory and add gold
		const sellItemResponse = inventory.sellItem(toSell, this.sellMultiplier, quantity);
		if (!sellItemResponse.isSuccessful()) return sellItemResponse;
		//add item to store inventory
		const increaseStockResponse = this.addItem(toSell, quantity);
		if (!increaseStockResponse.isSuccessful()) return increaseStockResponse;
		//format payload
		response.payload = {
			finalGold: sellItemResponse.payload.finalGold,
			storeItem: increaseStockResponse.payload,
			soldItem: sellItemResponse.payload.remainingItem
		}
		return response;
	}

	/**
	 * Removes all items from the store.
	 * @returns InventoryTransactionResponse containing the deleted itemList or an error message.
	 */
	emptyStore(): InventoryTransactionResponse {
		const response = this.deleteAll();
		return response;
	}

	/**
	 * Adds items to the store if their quantity is lower than the quantity in the stockList
	 * If there is an error in the process, rolls back to original list.
	 * @param stockList the list of items to restock. Defaults to the internal stocklist.
	 * @returns InventoryTransactionResponse of true or an error message.
	 */
	restockStore(stockList: ItemList = this.stockList): InventoryTransactionResponse {
		const currentItems = this.getAllItems();
		const response = new InventoryTransactionResponse();

		stockList.getAllItems().forEach((element, index) => {
			
			const containsItemResponse = this.contains(element.itemData);
			if (!containsItemResponse.isSuccessful()) return;
			if (containsItemResponse.payload) {
				//store contains item, get quantity and update
				const getItemResponse = this.getItem(element.itemData);
				if (!getItemResponse.isSuccessful()) {
					//should never occur, as we just checked contains
					response.addErrorMessage(getItemResponse.messages[0]);
				}
				const currentItem = getItemResponse.payload;
				if (currentItem.getQuantity() < element.getQuantity()) {
					//add missing quantity
					const addItemResponse = this.addItem(currentItem, element.getQuantity() - currentItem.getQuantity());
					if (!addItemResponse.isSuccessful()) {
						response.addErrorMessage(addItemResponse.messages[0]);
					}
				} else {
					//already enough quantity, exit
					return;
				}
			} else {
				//store does not contain item, add new one with full quantity
				const addItemResponse = this.addItem(element, element.getQuantity());
				if (!addItemResponse.isSuccessful()) {
					response.addErrorMessage(addItemResponse.messages[0]);
				}
			}
		})
		if (response.isSuccessful()) {
			response.payload = true;
		} else {
			//error, rollback
			this.items = new ItemList(currentItems);
		}
		return response;
	}


}