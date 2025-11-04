
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { getRandomInt } from "@/models/utility/RandomNumber";
import { v4 as uuidv4 } from "uuid";
import { EventReward } from "../EventReward";
import { RewardGenerator } from "../RewardGenerator";
import { dailyLoginRewardRepository } from "./DailyLoginRewardRepository";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";
import { DateTime } from 'luxon';

export class DailyLoginRewardFactory extends RewardGenerator {
	
	/**
	 * An object with various functions for creating reward buckets within a certain value range
	 * @rewardItems the list of possible items that this generator can give out
	 * @maxQuantity the maximum quantity of a single item in a single reward
	 */
	constructor(streak: number, rewardItems: InventoryItemList = DailyLoginRewardFactory.getDefaultRewardItems(streak), maxQuantity: number = DailyLoginRewardFactory.getDefaultMaxQuantity(streak), maxItems: number = DailyLoginRewardFactory.getDefaultMaxItems(streak)) {
		super(rewardItems, maxQuantity, maxItems);
	}

	static getDefaultRewardItems(streak: number): InventoryItemList {
		const config = dailyLoginRewardRepository.getDailyLoginConfig();
		const rewardSet = streak % 7 === 0 ? config.defaultRewards.weeklyBonus : config.defaultRewards.normal;

		let result = new InventoryItemList();
		for (const itemConfig of rewardSet.items) {
			let itemTemplate = itemTemplateFactory.getInventoryTemplateById(itemConfig.id);
			if (!itemTemplate) throw new Error(`Cannot find item template for ID: ${itemConfig.id}`);
			result.addItem(itemTemplate, itemConfig.quantity);
		}
		
		return result;
	}

	static getDefaultMaxQuantity(streak: number): number {
		const config = dailyLoginRewardRepository.getDailyLoginConfig();
		const rewardSet = streak % 7 === 0 ? config.defaultRewards.weeklyBonus : config.defaultRewards.normal;
		return rewardSet.maxQuantity;
	}

	static getDefaultMaxItems(streak: number): number {
		const config = dailyLoginRewardRepository.getDailyLoginConfig();
		const rewardSet = streak % 7 === 0 ? config.defaultRewards.weeklyBonus : config.defaultRewards.normal;
		return rewardSet.maxItems;
	}

	/**
	 * Generate the default gold reward amount for a daily login.
	 * If streak is a multiple of 7, returns 450 + rand(1,100) ~= 500
	 * Otherwise returns 200 + rand(1,100) ~= 250
	 * @streak the streak of the daily login reward
	*/
	static getDefaultGoldReward(streak: number): number {
		if (streak % 7 == 0) return 450 + getRandomInt(1, 100);
		return 200 + getRandomInt(1, 100);
	}

	// /**
	//  * Returns the number of milliseconds until the next UTC-7 midnight.
	//  */
	// static getDefaultTimeBetweenRewards(): number {
	// 	const now = new Date(Date.now());

	// 	// Helper to get a Date object at midnight UTC-7 for a given date
	// 	const getMidnightUtcMinus7 = (date: Date): Date => {
	// 		const d = new Date(date);
	// 		// To get the midnight of the *current* UTC-7 day, we need to consider the UTC-7 date components.
	// 		// Get the current date in UTC, then subtract the offset to align to UTC-7 "day boundary"
	// 		d.setUTCHours(d.getUTCHours() - 7); // Temporarily adjust to 'UTC-7' interpretation of day
	// 		d.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
	// 		d.setUTCHours(d.getUTCHours() + 7); // Adjust back to original UTC-7 offset for final representation
	// 		return d;
	// 	};

	// 	const currentDayMidnight = getMidnightUtcMinus7(now);
	// 	const nextMidnight = (now.getTime() < currentDayMidnight.getTime())
	// 		? currentDayMidnight
	// 		: getMidnightUtcMinus7(new Date(now.getTime() + 24 * 60 * 60 * 1000)); // Add 24 hours to get next day

	// 	return nextMidnight.getTime() - now.getTime();
	// }

	// /**
	//  * Checks if the user can claim a reward based on the current time and the event
	//  * @param currentTime - The current time to compare against the last occurrence
	//  * @param event - The event to check
	//  * @returns True if the user can claim a reward, false otherwise
	//  */
	// static canClaimReward(currentTime: Date = new Date(Date.now()), event: UserEvent): boolean {
	// 	if (event.getEventType() !== UserEventTypes.DAILY.name) return false;
	// 	// return true; // for testing purposes
	// 	if (process.env.DAILY_LOGIN_OVERRIDE === 'true') {
	// 		return currentTime.getTime() > event.getCreatedAt().getTime() + 10000;
	// 	}
		
	// 	const lastClaimDate = event.getCreatedAt();

	// 	// Helper to get a Date object at midnight UTC-7 for a given date
	// 	const getMidnightUtcMinus7 = (date: Date): Date => {
	// 		const d = new Date(date);
	// 		// To get the midnight of the *current* UTC-7 day, we need to consider the UTC-7 date components.
	// 		// Get the current date in UTC, then subtract the offset to align to UTC-7 "day boundary"
	// 		d.setUTCHours(d.getUTCHours() - 7); // Temporarily adjust to 'UTC-7' interpretation of day
	// 		d.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
	// 		d.setUTCHours(d.getUTCHours() + 7); // Adjust back to original UTC-7 offset for final representation
	// 		return d;
	// 	};

	// 	const currentDayUtcMinus7 = getMidnightUtcMinus7(currentTime);
	// 	const lastClaimDayUtcMinus7 = getMidnightUtcMinus7(lastClaimDate);

	// 	// If the current day (UTC-7) is after the last claim day (UTC-7), a new day has started.
	// 	return currentDayUtcMinus7.getTime() > lastClaimDayUtcMinus7.getTime();
	// }

	/**
	 * Returns the number of milliseconds until the next midnight UTC-7.
	 */
	static getDefaultTimeBetweenRewards(): number {
		const now = DateTime.now(); // Get the current time in the client's local time zone

		// Convert the current time to UTC
		const utcNow = now.toUTC();

		// Get the current midnight UTC-7 (adjust to UTC-7 time zone)
		const currentDayMidnightUtcMinus7 = utcNow.setZone('UTC-7').startOf('day');

		// If the current time is already past midnight UTC-7, calculate for the next midnight UTC-7
		const nextMidnight = utcNow > currentDayMidnightUtcMinus7 ? currentDayMidnightUtcMinus7.plus({ days: 1 }) : currentDayMidnightUtcMinus7;

		return nextMidnight.toMillis() - utcNow.toMillis(); // Return the time until the next midnight UTC-7
	}

	/**
	 * Checks if the user can claim a reward based on the current time (Date object) and the last occurrence
	 * @param currentTime - The current time to compare against the last occurrence (in Date object format).
	 * @param event - The event to check.
	 * @returns True if the user can claim a reward, false otherwise.
	 */
	static canClaimReward(currentTime: Date = new Date(), event: UserEvent): boolean {
		if (event.getEventType() !== UserEventTypes.DAILY.name) return false;
		if (process.env.DAILY_LOGIN_OVERRIDE === 'true') {
			return currentTime.getTime() > event.getCreatedAt().getTime() + 1000;
		}
		const lastClaimDate = event.getCreatedAt();  // Assuming this is a Date object

		// Convert currentTime and lastClaimDate to UTC timestamps
		const utcCurrentTime = new Date(currentTime.toUTCString()); // Converts to UTC
		const utcLastClaimTime = new Date(lastClaimDate.toUTCString()); // Converts to UTC

		// Get midnight UTC-7 for both current time and last claim time
		const currentDayMidnightUtcMinus7 = this.getMidnightUtcMinus7(utcCurrentTime);
		const lastClaimDayMidnightUtcMinus7 = this.getMidnightUtcMinus7(utcLastClaimTime);

		// Check if the current time (in UTC-7) is after the last claim date (also in UTC-7)
		return currentDayMidnightUtcMinus7 > lastClaimDayMidnightUtcMinus7;
	}

	/**
	 * Helper function to get midnight UTC-7 for a given date (Date object).
	 * @param date - A Date object.
	 * @returns A Date object representing midnight UTC-7.
	 */
	static getMidnightUtcMinus7(date: Date): Date {
		const d = new Date(date); // Clone the date object to avoid mutation

		// Convert the date to UTC
		const utcTime = new Date(d.toUTCString());

		// Get midnight in UTC
		utcTime.setUTCHours(0, 0, 0, 0); // Set to 00:00:00 UTC

		// Adjust to UTC-7 (subtract 7 hours from UTC)
		utcTime.setUTCHours(utcTime.getUTCHours() - 7);

		return utcTime;  // Returns the Date object set to midnight UTC-7
	}

	
	/**
	 * Generates an EventReward object, which contains a list of items and their quantities, as well as an amount of gold,
	 * meant to be given to the player.
	 * The total number of bundles will be less than this.maxItems.
	 * There will be at most this.maxQuantity number of each bundle.
	 * The list of items is generated from this.rewardItems, using the quantity on each item.
	 * @userId the user id to set in the EventReward
	 * @inventoryId the inventory id to set in the EventReward
	 * @gold the amount of gold to set in the EventReward
	 * @streak the streak to set in the EventReward
	 * @message the message to set in the EventReward
	 */
	 createRewardBucket(
		userId: string,
		inventoryId: string,
		streak: number,
		gold: number,
		message: string = ""
	): EventReward {
		const reward = new EventReward({
			eventType: UserEventTypes.DAILY.name,
			userId,
			inventoryId,
			streak,
			gold,
			message,
		});
	
		const generatedItems = new InventoryItemList();
	
		// Precompute batches: each rewardItem entry is one batch type
		const rewardBatches = this.rewardItems.getAllItems().filter((item: any) => item.getQuantity() > 0).map((item: any) => {
			return {
				itemTemplate: item.itemData,
				batchSize: item.getQuantity(), // batch = all quantity from rewardItems
			};
		});
	
		// Helpers
		const getStack = (itemTemplate: any) =>
			generatedItems.getAllItems().find((stack: any) => stack.itemData.id === itemTemplate.id);
	
		const getBatchCount = (itemTemplate: any, batchSize: number) => {
			if (batchSize <= 0) return 0; // prevent division by zero
			return Math.floor((getStack(itemTemplate)?.getQuantity() ?? 0) / batchSize);
		};
	
		const canAddBatch = (itemTemplate: any, batchSize: number) =>
			getBatchCount(itemTemplate, batchSize) < this.maxQuantity;
	
		const getTotalBatchCount = () =>
			generatedItems.getAllItems().reduce(
				(total: number, stack: any) => {
					const batchSize = rewardBatches.find(b => b.itemTemplate.id === stack.itemData.id)?.batchSize ?? 1;
					return total + Math.floor(stack.getQuantity() / batchSize);
				},
				0
			);
	
		// Randomly fill bucket up to maxItems (total batches)
		while (getTotalBatchCount() < this.maxItems && rewardBatches.length > 0) {
			const batchIndex = Math.floor(Math.random() * rewardBatches.length);
			const { itemTemplate, batchSize } = rewardBatches[batchIndex];
	
			if (canAddBatch(itemTemplate, batchSize)) {
				generatedItems.addItem(itemTemplate, batchSize);
			} else {
				// If we've maxed out this batch type, remove it from eligibility
				rewardBatches.splice(batchIndex, 1);
			}
		}
	
		reward.setItems(generatedItems);
		return reward;
	}	

	//  createRewardBucket(
	// 	userId: string,
	// 	inventoryId: string,
	// 	streak: number,
	// 	gold: number,
	// 	targetValue: number,
	// 	message: string = ""
	// ): EventReward {
	// 	const reward = new EventReward({
	// 		userId,
	// 		inventoryId,
	// 		streak,
	// 		gold,
	// 		message,
	// 	});
	
	// 	const generatedItems = new InventoryItemList();
	
	// 	// Snapshot of all available item templates (assumes each has a stable id and numeric value)
	// 	const availableItemTemplates = this.rewardItems.getAllItems()
	// 		.map((i: any) => i.itemData)
	// 		.filter((itemTemplate: any) => typeof itemTemplate?.value === "number" && itemTemplate.value > 0);
	
	// 	// Helpers
	// 	const getStack = (itemTemplate: any) =>
	// 		generatedItems.getAllItems().find((stack: any) => stack.itemData.id === itemTemplate.id);
	
	// 	const getQuantity = (itemTemplate: any) =>
	// 		(getStack(itemTemplate)?.getQuantity() ?? 0);
	
	// 	const canAddOneMore = (itemTemplate: any) =>
	// 		getQuantity(itemTemplate) < this.maxQuantity;
	
	// 	const getDistinctItemCount = () =>
	// 		generatedItems.getAllItems().length;
	
	// 	const getTotalValue = () =>
	// 		generatedItems.getAllItems().reduce(
	// 			(sum: number, stack: any) => sum + stack.itemData.value * stack.quantity,
	// 			0
	// 		);
	
	// 	const itemsByValueDescending = [...availableItemTemplates].sort((a, b) => b.value - a.value);
	
	// 	// Upper bound check: even the best case?
	// 	const bestPossibleWithLimits = (() => {
	// 		let possibleValue = 0;
	// 		let stackCount = 0;
	// 		for (const itemTemplate of itemsByValueDescending) {
	// 			if (stackCount >= this.maxItems) break;
	// 			possibleValue += itemTemplate.value * this.maxQuantity;
	// 			stackCount += 1;
	// 		}
	// 		return possibleValue;
	// 	})();
	
	// 	// Pick 1 unit at a time trying to stay close to 100% of target.
	// 	const tryBuildRandom = (maxSteps = 10_000): boolean => {
	// 		let steps = 0;
	// 		while (getTotalValue() < targetValue && steps++ < maxSteps) {
	// 			const remainingValue = targetValue - getTotalValue();
	
	// 			// What’s eligible right now?
	// 			const canAddNewStack = getDistinctItemCount() < this.maxItems;
	// 			const eligibleItems = availableItemTemplates.filter(itemTemplate =>
	// 				(canAddNewStack || getQuantity(itemTemplate) > 0) &&
	// 				canAddOneMore(itemTemplate)
	// 			);
	
	// 			if (eligibleItems.length === 0) break; // stuck in this attempt
	
	// 			// Prefer items that don’t overshoot; otherwise pick the smallest overshoot.
	// 			const underOrEqualToRemaining = eligibleItems.filter(itemTemplate => itemTemplate.value <= remainingValue);
	// 			let chosenItemTemplate: any;
	
	// 			if (underOrEqualToRemaining.length > 0) {
	// 				// Bias toward higher values but keep some randomness
	// 				const sortedCandidates = underOrEqualToRemaining.sort((a, b) => b.value - a.value);
	// 				const candidatePool = sortedCandidates.slice(0, Math.min(3, sortedCandidates.length)); // top-3 variety
	// 				chosenItemTemplate = candidatePool[Math.floor(Math.random() * candidatePool.length)];
	// 			} else {
	// 				// All candidates overshoot; pick the smallest single-item overshoot
	// 				chosenItemTemplate = eligibleItems.reduce((best, itemTemplate) => {
	// 					const bestOvershoot = best ? best.value - remainingValue : Number.POSITIVE_INFINITY;
	// 					const thisOvershoot = itemTemplate.value - remainingValue;
	// 					return thisOvershoot < bestOvershoot ? itemTemplate : best;
	// 				}, null as any);
	// 			}
	
	// 			// Add exactly ONE unit (so overshoot is at most one item’s value)
	// 			if (chosenItemTemplate && canAddOneMore(chosenItemTemplate)) {
	// 				generatedItems.addItem(chosenItemTemplate, 1);
	// 			} else {
	// 				break; // nothing actionable
	// 			}
	// 		}
	// 		return getTotalValue() >= targetValue;
	// 	};
	
	// 	// Deterministic greedy fallback that prefers higher-value items (guarantees success if feasible)
	// 	const buildGreedyHighValue = () => {
	// 		// Clear and rebuild
	// 		const freshItemList = new InventoryItemList();
	
	// 		const tryAddOne = (itemTemplate: any) => {
	// 			const existingStack = freshItemList.getAllItems().find((stack: any) => stack.itemData.id === itemTemplate.id);
	// 			if (!existingStack && freshItemList.getAllItems().length >= this.maxItems) return false;
	// 			const existingQuantity = existingStack?.getQuantity() ?? 0;
	// 			if (existingQuantity >= this.maxQuantity) return false;
	// 			freshItemList.addItem(itemTemplate, 1);
	// 			return true;
	// 		};
	
	// 		let currentValue = 0;
	// 		outer: while (currentValue < targetValue) {
	// 			let progressed = false;
	// 			for (const itemTemplate of itemsByValueDescending) {
	// 				if (currentValue >= targetValue) break outer;
	// 				if (tryAddOne(itemTemplate)) {
	// 					currentValue += itemTemplate.value;
	// 					progressed = true;
	// 					if (currentValue >= targetValue) break outer;
	// 				}
	// 			}
	// 			if (!progressed) break; // cannot add anything else
	// 		}
	
	// 		return { list: freshItemList, value: currentValue };
	// 	};
	
	// 	// 1) Random pass for variety, respecting limits strictly
	// 	const maxRandomAttempts = 5;
	// 	let success = false;
	// 	for (let attempt = 0; attempt < maxRandomAttempts && !success; attempt++) {
	// 		if (generatedItems.getAllItems().length) {
	// 			generatedItems.deleteAll();
	// 		}
	
	// 		// Shuffle available a bit each attempt for variety
	// 		for (let i = availableItemTemplates.length - 1; i > 0; i--) {
	// 			const j = Math.floor(Math.random() * (i + 1));
	// 			[availableItemTemplates[i], availableItemTemplates[j]] = [availableItemTemplates[j], availableItemTemplates[i]];
	// 		}
	// 		success = tryBuildRandom();
	// 	}
	
	// 	// 2) If random couldn’t reach target but it’s theoretically possible, greedily upgrade with high-value bias
	// 	if (!success && bestPossibleWithLimits >= targetValue) {
	// 		const { list: greedyList, value: greedyValue } = buildGreedyHighValue();
	
	// 		if (greedyValue >= targetValue) {
	// 			reward.setItems(greedyList);
	// 			return reward;
	// 		}
	// 	}
	
	// 	// 3) If even the best case cannot reach target, return the best possible pack (maximizes value under limits)
	// 	if (getTotalValue() < targetValue && bestPossibleWithLimits < targetValue) {
	// 		const bestEffortList = new InventoryItemList();
	// 		let usedStacks = 0;
	// 		for (const itemTemplate of itemsByValueDescending) {
	// 			if (usedStacks >= this.maxItems) break;
	// 			const qty = this.maxQuantity;
	// 			if (qty > 0) {
	// 				bestEffortList.addItem(itemTemplate, qty);
	// 				usedStacks += 1;
	// 			}
	// 		}
	// 		reward.setItems(bestEffortList);
	// 		return reward;
	// 	}
	
	// 	// 4) Otherwise, random succeeded; just attach what we built.
	// 	reward.setItems(generatedItems);
	// 	return reward;
	// }	
	
}