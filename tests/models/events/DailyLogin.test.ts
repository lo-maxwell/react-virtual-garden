import { DailyLoginRewardFactory } from "../../../models/events/dailyLogin/DailyLoginRewardFactory";
import { InventoryItemList } from "../../../models/itemStore/InventoryItemList";
import { itemTemplateFactory } from "../../../models/items/templates/models/ItemTemplateFactory";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";
import { DateTime } from "luxon";

beforeEach(() => {
	
});

test('Should initialize new DailyLoginRewardFactory Object with default values', () => {
	const factory = new DailyLoginRewardFactory(
		0,
		DailyLoginRewardFactory.getDefaultRewardItems(0),
		DailyLoginRewardFactory.getDefaultMaxQuantity(0),
		DailyLoginRewardFactory.getDefaultMaxItems(0)
	);

	expect(factory).toBeInstanceOf(DailyLoginRewardFactory);

	const defaultItems = DailyLoginRewardFactory.getDefaultRewardItems(0).getAllItems();
	const factoryItems = factory.getRewardItems().getAllItems();

	expect(factoryItems.length).toBe(defaultItems.length);
	defaultItems.forEach(defaultItem => {
		const matchingFactoryItem = factoryItems.find(fItem =>
			fItem.itemData.id === defaultItem.itemData.id &&
			fItem.getQuantity() === defaultItem.getQuantity()
		);
		expect(matchingFactoryItem).toBeDefined();
	});


	expect(factory.getMaxQuantity()).toBe(DailyLoginRewardFactory.getDefaultMaxQuantity(0));
	expect(factory.getMaxItems()).toBe(DailyLoginRewardFactory.getDefaultMaxItems(0));
});

test('Should initialize new DailyLoginRewardFactory Object with custom values', () => {
	const customRewardItems = new InventoryItemList();
	
	let appleSeedTemplate = itemTemplateFactory.getInventoryTemplateById("1-01-09-01-00");
	if (!appleSeedTemplate) throw new Error("Cannot find apple seed template!");
	customRewardItems.addItem(appleSeedTemplate, 5);

	let bananaSeedTemplate = itemTemplateFactory.getInventoryTemplateById("1-01-10-01-00");
	if (!bananaSeedTemplate) throw new Error("Cannot find banana seed template!");
	customRewardItems.addItem(bananaSeedTemplate, 2);

	const customMaxQuantity = 10;
	const customMaxItems = 2;

	const factory = new DailyLoginRewardFactory(
		0,
		customRewardItems,
		customMaxQuantity,
		customMaxItems
	);

	expect(factory).toBeInstanceOf(DailyLoginRewardFactory);

	const factoryItems = factory.getRewardItems().getAllItems();
	const expectedItems = customRewardItems.getAllItems();

	expect(factoryItems.length).toBe(expectedItems.length);
	expectedItems.forEach(expectedItem => {
		const matchingFactoryItem = factoryItems.find(fItem =>
			fItem.itemData.id === expectedItem.itemData.id &&
			fItem.getQuantity() === expectedItem.getQuantity()
		);
		expect(matchingFactoryItem).toBeDefined();
	});

	expect(factory.getMaxQuantity()).toBe(customMaxQuantity);
	expect(factory.getMaxItems()).toBe(customMaxItems);
});

test('Should Create Reward Bucket with valid inputs', () => {
	const factory = new DailyLoginRewardFactory(
		0,
		DailyLoginRewardFactory.getDefaultRewardItems(0),
		DailyLoginRewardFactory.getDefaultMaxQuantity(0),
		DailyLoginRewardFactory.getDefaultMaxItems(0)
	);

	const userId = "testUser";
	const inventoryId = "testInventory";
	const streak = 1;
	const gold = 100;
	const message = "Daily Login Reward!";

	const reward = factory.createRewardBucket(userId, inventoryId, streak, gold, message);

	expect(reward).toBeDefined();
	expect(reward.getUserId()).toBe(userId);
	expect(reward.getInventoryId()).toBe(inventoryId);
	expect(reward.getStreak()).toBe(streak);
	expect(reward.getGold()).toBe(gold);
	expect(reward.getMessage()).toBe(message);

	const rewardItems = reward.getItems().getAllItems();
	expect(rewardItems.length).toBeLessThanOrEqual(factory.getMaxItems());

	const rewardBatches = factory.getRewardItems().getAllItems().map((item: any) => {
		return {
			itemTemplate: item.itemData,
			batchSize: item.getQuantity(),
		};
	});

	rewardItems.forEach((item: any) => {
		const correspondingBatch = rewardBatches.find(b => b.itemTemplate.id === item.itemData.id);
		if (correspondingBatch) {
			const batchCount = Math.floor(item.getQuantity() / correspondingBatch.batchSize);
			expect(batchCount).toBeGreaterThan(0);
			expect(batchCount).toBeLessThanOrEqual(factory.getMaxQuantity());
		}
	});

});

test('Should Create Reward Bucket with missing inputs', () => {
	// Create a factory with an empty rewardItems list to simulate "missing" items
	const emptyRewardItems = new InventoryItemList();
	const factory = new DailyLoginRewardFactory(
		0,
		emptyRewardItems,
		DailyLoginRewardFactory.getDefaultMaxQuantity(0),
		DailyLoginRewardFactory.getDefaultMaxItems(0)
	);

	const userId = ""; // Missing/empty user ID
	const inventoryId = ""; // Missing/empty inventory ID
	const streak = 0; // Zero streak
	const gold = 0; // Zero gold
	const message = ""; // Default/empty message

	const reward = factory.createRewardBucket(userId, inventoryId, streak, gold, message);

	expect(reward).toBeDefined();
	expect(reward.getUserId()).toBe(userId);
	expect(reward.getInventoryId()).toBe(inventoryId);
	expect(reward.getStreak()).toBe(streak);
	expect(reward.getGold()).toBe(gold);
	expect(reward.getMessage()).toBe(message);

	// With an empty rewardItems list, the generatedItems list should also be empty.
	const rewardItems = reward.getItems().getAllItems();
	expect(rewardItems.length).toBe(0);
});

test('Should Create Reward Bucket respecting low maxItems and maxQuantity', () => {
	const rewardItems = DailyLoginRewardFactory.getDefaultRewardItems(0);
	const lowMaxQuantity = 1; // Allow only 1 batch of each item type
	const lowMaxItems = 1; // Allow only 1 total batch

	const factory = new DailyLoginRewardFactory(
		0,
		rewardItems,
		lowMaxQuantity,
		lowMaxItems
	);

	const userId = "testUser2";
	const inventoryId = "testInventory2";
	const streak = 2;
	const gold = 50;
	const message = "Small Reward!";

	const reward = factory.createRewardBucket(userId, inventoryId, streak, gold, message);

	expect(reward).toBeDefined();
	expect(reward.getUserId()).toBe(userId);
	expect(reward.getInventoryId()).toBe(inventoryId);
	expect(reward.getStreak()).toBe(streak);
	expect(reward.getGold()).toBe(gold);
	expect(reward.getMessage()).toBe(message);

	const generatedRewardItems = reward.getItems().getAllItems();
	expect(generatedRewardItems.length).toBeLessThanOrEqual(lowMaxItems); // Should not exceed 1 distinct item

	const factoryRewardBatches = factory.getRewardItems().getAllItems().map((item: any) => {
		return {
			itemTemplate: item.itemData,
			batchSize: item.getQuantity(),
		};
	});

	generatedRewardItems.forEach((item: any) => {
		const correspondingBatch = factoryRewardBatches.find(b => b.itemTemplate.id === item.itemData.id);
		if (correspondingBatch) {
			const batchCount = Math.floor(item.getQuantity() / correspondingBatch.batchSize);
			expect(batchCount).toBeGreaterThan(0); // Should have at least one batch
			expect(batchCount).toBeLessThanOrEqual(lowMaxQuantity); // Should not exceed 1 batch of this type
		}
	});
});

/* ---------------------------------------------------------
   getDefaultGoldReward
--------------------------------------------------------- */

describe("DailyLoginRewardFactory.getDefaultGoldReward()", () => {
    test("returns ~200–300 gold for non-weekly streaks", () => {
        const streak = 3;
        const gold = DailyLoginRewardFactory.getDefaultGoldReward(streak);

        expect(gold).toBeGreaterThanOrEqual(200 + 1);
        expect(gold).toBeLessThanOrEqual(200 + 100);
    });

    test("returns ~450–550 gold for weekly streaks (7,14,21...)", () => {
        const streak = 7;
        const gold = DailyLoginRewardFactory.getDefaultGoldReward(streak);

        expect(gold).toBeGreaterThanOrEqual(450 + 1);
        expect(gold).toBeLessThanOrEqual(450 + 100);
    });
});

/* ---------------------------------------------------------
   getDefaultTimeBetweenRewards
--------------------------------------------------------- */

describe("DailyLoginRewardFactory.getDefaultTimeBetweenRewards()", () => {
    test("returns a positive number of milliseconds", () => {
        const ms = DailyLoginRewardFactory.getDefaultTimeBetweenRewards();
        expect(typeof ms).toBe("number");
        expect(ms).toBeGreaterThan(0);
    });

    test("always returns a value less than or equal to 24 hours", () => {
        const ms = DailyLoginRewardFactory.getDefaultTimeBetweenRewards();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        expect(ms).toBeLessThanOrEqual(twentyFourHours);
    });
});

/* ---------------------------------------------------------
   canClaimReward()
--------------------------------------------------------- */

describe("DailyLoginRewardFactory.canClaimReward()", () => {

    test("returns false if event is not DAILY", () => {
        const event = new UserEvent(
            null,
            "user",
            UserEventTypes.WEEKLY.name,  // Not daily
            new Date()
        );

        expect(DailyLoginRewardFactory.canClaimReward(new Date(), event)).toBe(false);
    });

    test("returns false if claiming on the same LA calendar day", () => {
        const now = new Date();
        const event = new UserEvent(
            null,
            "user",
            UserEventTypes.DAILY.name,
            now
        );

        expect(DailyLoginRewardFactory.canClaimReward(now, event)).toBe(false);
    });

    test("returns true if claiming on the next LA calendar day", () => {
        const lastClaim = DateTime.now().setZone("America/Los_Angeles").minus({ days: 1 }).toJSDate();
        const now = new Date();

        const event = new UserEvent(
            null,
            "user",
            UserEventTypes.DAILY.name,
            lastClaim
        );

        expect(DailyLoginRewardFactory.canClaimReward(now, event)).toBe(true);
    });

    test("respects DAILY_LOGIN_OVERRIDE=true and allows claiming after 1 second", () => {
        process.env.DAILY_LOGIN_OVERRIDE = "true";

        const event = new UserEvent(
            null,
            "user",
            UserEventTypes.DAILY.name,
            new Date(Date.now())
        );

        const oneSecondAfter = new Date(Date.now() + 1500);

        expect(DailyLoginRewardFactory.canClaimReward(oneSecondAfter, event)).toBe(true);

        process.env.DAILY_LOGIN_OVERRIDE = "false";
    });

    test("override still prevents claiming before 1 second", () => {
        process.env.DAILY_LOGIN_OVERRIDE = "true";

        const event = new UserEvent(
            null,
            "user",
            UserEventTypes.DAILY.name,
            new Date()
        );

        const tooEarly = new Date(Date.now() + 200);

        expect(DailyLoginRewardFactory.canClaimReward(tooEarly, event)).toBe(false);

        process.env.DAILY_LOGIN_OVERRIDE = "false";
    });

});

/* ---------------------------------------------------------
   getDefaultRewardItems / maxQuantity / maxItems
   (streak-dependent config switching)
--------------------------------------------------------- */

describe("DailyLoginRewardFactory default config switching", () => {

    // test("uses normal rewards for non-weekly streak", () => {
    //     const items = DailyLoginRewardFactory.getDefaultRewardItems(1);
    //     const config = DailyLoginRewardFactory.getDefaultRewardItems(1);

    //     expect(items.getAllItems().length).toBe(config.getAllItems().length);
    // });

    // test("uses weekly rewards for streak % 7 === 0", () => {
    //     const weeklyItems = DailyLoginRewardFactory.getDefaultRewardItems(7);
    //     const normalItems = DailyLoginRewardFactory.getDefaultRewardItems(1);

    //     expect(weeklyItems.getAllItems().length).not.toBe(normalItems.getAllItems().length);
    // });

    test("weekly maxQuantity and maxItems differ from normal", () => {
        const weeklyQ = DailyLoginRewardFactory.getDefaultMaxQuantity(7);
        const normalQ = DailyLoginRewardFactory.getDefaultMaxQuantity(1);

        const weeklyI = DailyLoginRewardFactory.getDefaultMaxItems(7);
        const normalI = DailyLoginRewardFactory.getDefaultMaxItems(1);

        expect(weeklyQ).not.toBe(normalQ);
        expect(weeklyI).not.toBe(normalI);
    });

});