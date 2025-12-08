import { EventReward } from "@/models/events/EventReward";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";

// Mock uuid so tests are deterministic
jest.mock('uuid', () => ({
    v4: () => "mock-uuid"
}));

describe("EventReward", () => {
    test("constructor initializes with provided values", () => {
        const reward = new EventReward({
            id: "abc",
            eventType: UserEventTypes.DAILY.name,
            userId: "user1",
            inventoryId: "inv123",
            streak: 5,
            gold: 10,
            message: "Hello"
        });

        expect(reward.getId()).toBe("abc");
        expect(reward.getEventType()).toBe(UserEventTypes.DAILY.name);
        expect(reward.getUserId()).toBe("user1");
        expect(reward.getInventoryId()).toBe("inv123");
        expect(reward.getStreak()).toBe(5);
        expect(reward.getGold()).toBe(10);
        expect(reward.getMessage()).toBe("Hello");
    });

    test("constructor fills defaults when fields omitted", () => {
        const reward = new EventReward();

        expect(reward.getId()).toBe("mock-uuid");
        expect(reward.getEventType()).toBe(UserEventTypes.ERROR.name);
        expect(reward.getUserId()).toBe("");
        expect(reward.getInventoryId()).toBe("");
        expect(reward.getStreak()).toBe(0);
        expect(reward.getGold()).toBe(0);
        expect(reward.getMessage()).toBe("");
        expect(reward.getItems()).toBeInstanceOf(InventoryItemList);
    });

    describe("fromPlainObject", () => {
        test("hydrates valid object", () => {
            const plain = {
                id: "abc123",
                eventType: UserEventTypes.DAILY.name,
                userId: "userX",
                inventoryId: "invX",
                streak: 3,
                gold: 9,
                message: "yay",
                items: {}
            };

            const reward = EventReward.fromPlainObject(plain);

            expect(reward.getId()).toBe("abc123");
            expect(reward.getEventType()).toBe(UserEventTypes.DAILY.name);
            expect(reward.getUserId()).toBe("userX");
            expect(reward.getInventoryId()).toBe("invX");
            expect(reward.getStreak()).toBe(3);
            expect(reward.getGold()).toBe(9);
            expect(reward.getMessage()).toBe("yay");
            expect(reward.getItems()).toBeInstanceOf(InventoryItemList);
        });

        test("returns new default EventReward on invalid structure", () => {
            const reward = EventReward.fromPlainObject(null as any);

            expect(reward.getEventType()).toBe(UserEventTypes.ERROR.name);
            expect(reward.getId()).toBe("mock-uuid");
        });

        test("invalid userId triggers ERROR eventType", () => {
            const reward = EventReward.fromPlainObject({
                userId: 999, // invalid
                eventType: UserEventTypes.DAILY.name
            });

            expect(reward.getEventType()).toBe(UserEventTypes.ERROR.name);
        });
    });

    test("toPlainObject returns correct structure", () => {
        const reward = new EventReward({
            id: "id1",
            eventType: UserEventTypes.WEEKLY.name,
            userId: "u1",
            inventoryId: "inv1",
            streak: 2,
            gold: 5,
            message: "msg"
        });

        const plain = reward.toPlainObject();

        expect(plain).toEqual({
            id: "id1",
            eventType: UserEventTypes.WEEKLY.name,
            userId: "u1",
            inventoryId: "inv1",
            streak: 2,
            items: reward.getItems().toPlainObject(),
            gold: 5,
            message: "msg"
        });
    });

    test("getters and setters update values correctly", () => {
        const reward = new EventReward();

        reward.setId("newID");
        reward.setEventType(UserEventTypes.WEEKLY.name);
        reward.setUserId("userX");
        reward.setInventoryId("invX");
        reward.setStreak(10);
        reward.setGold(99);
        reward.setMessage("hello");

        const items = new InventoryItemList();
        reward.setItems(items);

        expect(reward.getId()).toBe("newID");
        expect(reward.getEventType()).toBe(UserEventTypes.WEEKLY.name);
        expect(reward.getUserId()).toBe("userX");
        expect(reward.getInventoryId()).toBe("invX");
        expect(reward.getStreak()).toBe(10);
        expect(reward.getGold()).toBe(99);
        expect(reward.getMessage()).toBe("hello");
        expect(reward.getItems()).toBe(items);
    });

    test("getDefaultEventReward returns a new EventReward with defaults", () => {
        const reward = EventReward.getDefaultEventReward();

        expect(reward).toBeInstanceOf(EventReward);
        expect(reward.getEventType()).toBe(UserEventTypes.ERROR.name);
    });
});
