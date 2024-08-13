import { ItemList } from "../itemStore/ItemList";

export class RewardGenerator {
	rewardItems: ItemList;
	maxQuantity: number;
	maxItems: number;
	
	/**
	 * An object with various functions for creating reward buckets within a certain value range
	 * @rewardItems the list of possible items that this generator can give out
	 * @maxQuantity the maximum quantity of a single item in a single reward
	 */
	constructor(rewardItems: ItemList, maxQuantity: number, maxItems: number) {
		this.rewardItems = rewardItems;
		this.maxQuantity = maxQuantity;
		this.maxItems = maxItems;
	}

	getRewardItems(): ItemList {
		return this.rewardItems;
	}

	setRewardItems(rewardItems: ItemList): void {
		this.rewardItems = rewardItems;
	}

	getMaxQuantity(): number {
		return this.maxQuantity;
	}

	setMaxQuantity(newMaxQuantity: number): void {
		this.maxQuantity = newMaxQuantity;
	}

	getMaxItems(): number {
		return this.maxItems;
	}

	setMaxItems(newMaxItems: number): void {
		this.maxItems = newMaxItems;
	}

}