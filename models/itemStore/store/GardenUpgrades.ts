import { Garden } from "@/models/garden/Garden";
import User from "@/models/user/User";
import { Inventory } from "../inventory/Inventory";
import { InventoryTransactionResponse } from "../inventory/InventoryTransactionResponse";
import { Store } from "./Store";

export class GardenUpgrades {


	//Consider changing the formula so people are incentivized to build NxN gardens
	//Have to do it so that you dont get a discount by going in 1 direction first though
	//Maybe just same cost regardless so its more efficient to go both sides
	/**
	 * Calculate the cost in gold to expand the garden by 1 row
	 * Formula: each new plot costs (number of existing plots * 25 gold)
	 * @param garden the garden to expand
	 * @param store the store, which has an upgradeMultiplier
	 * @returns the cost
	 */
	static getRowExpansionCost(garden: Garden, store: Store) {
		let currentSize = garden.size();
		let totalCost = 0;
		for (let i = 0; i < garden.getCols(); i++) {
			totalCost += 25 * currentSize;
			currentSize++;
		}
		return totalCost;
	}

	/**
	 * Calculate the cost in gold to expand the garden by 1 column
	 * Formula: each new plot costs (number of existing plots * 25 gold)
	 * @param garden the garden to expand
	 * @param store the store, which has an upgradeMultiplier
	 * @returns the cost
	 */
	static getColExpansionCost(garden: Garden, store: Store) {
		let currentSize = garden.size();
		let totalCost = 0;
		for (let i = 0; i < garden.getRows(); i++) {
			totalCost += 25 * currentSize;
			currentSize++;
		}
		return Math.floor(totalCost * store.getUpgradeMultiplier());
	}	

	/**
	 * Inventory pays gold to expand the garden by 1 row. 
	 * @param garden the garden to expand
	 * @param store the store they are paying to
	 * @param inventory the inventory that is paying gold
	 * @returns InventoryTransactionResponse containing the final gold or an error message
	 */
	static expandRow(garden: Garden, store: Store, inventory: Inventory, user: User): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (!garden.canAddColumn(user)) {
			const levelRequired = (garden.getCols() + 1 - 5) * 5;
			response.addErrorMessage(`Need to be level ${levelRequired} to expand row, currently level ${user.getLevel()}`);
			return response;
		}
		const buyResponse = store.buyCustomObjectFromStore(inventory, this.getRowExpansionCost(garden, store));
		if (!buyResponse.isSuccessful()) return buyResponse;
		garden.addRow(user);
		response.payload = buyResponse.payload;
		return response;
	}

	/**
	 * Inventory pays gold to expand the garden by 1 column. 
	 * @param garden the garden to expand
	 * @param store the store they are paying to
	 * @param inventory the inventory that is paying gold
	 * @returns InventoryTransactionResponse containing the final gold or an error message
	 */
	 static expandColumn(garden: Garden, store: Store, inventory: Inventory, user: User): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (!garden.canAddRow(user)) {
			const levelRequired = (garden.getRows() + 1 - 5) * 5;
			response.addErrorMessage(`Need to be level ${levelRequired} to expand column, currently level ${user.getLevel()}`);
			return response;
		}
		const buyResponse = store.buyCustomObjectFromStore(inventory, this.getColExpansionCost(garden, store));
		if (!buyResponse.isSuccessful()) return buyResponse;
		garden.addColumn(user);
		response.payload = buyResponse.payload;
		return response;
	}
}