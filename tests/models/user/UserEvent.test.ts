import { EventReward } from "@/models/events/EventReward";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";


describe("UserEvent", () => {
    const baseUser = "testUser";
    const baseType = UserEventTypes.DAILY.name;

    test("constructs correctly with provided arguments", () => {
        const createdAt = new Date("2024-01-01T00:00:00Z");
        const reward = new EventReward({
            eventType: baseType,
            userId: baseUser,
            inventoryId: "inv1",
            streak: 5,
            gold: 10,
            message: "reward"
        });

        const event = new UserEvent("id123", baseUser, baseType, createdAt, 5, reward);

        expect(event.getId()).toBe("id123");
        expect(event.getUser()).toBe(baseUser);
        expect(event.getEventType()).toBe(baseType);
        expect(event.getCreatedAt()).toEqual(createdAt);
        expect(event.getStreak()).toBe(5);
        expect(event.getEventReward()).toBe(reward);
    });

    test("assigns default values when optional constructor args are omitted", () => {
        const event = new UserEvent(null, baseUser, baseType);

        expect(event.getId()).toBeDefined();
        expect(event.getUser()).toBe(baseUser);
        expect(event.getEventType()).toBe(baseType);
        expect(event.getStreak()).toBe(0);
        expect(event.getEventReward()).toBeInstanceOf(EventReward);
    });

    describe("fromPlainObject", () => {
        test("creates a valid UserEvent from plain object", () => {
            const plain = {
                id: "abc",
                user: baseUser,
                event_type: baseType,
                created_at: "2024-01-02T00:00:00Z",
                streak: 3,
                event_reward: {
                    eventType: baseType,
                    userId: baseUser,
                    inventoryId: "inv1",
                    streak: 3,
                    gold: 5,
                    message: "nice"
                }
            };

            const event = UserEvent.fromPlainObject(plain);

            expect(event.getId()).toBe("abc");
            expect(event.getUser()).toBe(baseUser);
            expect(event.getEventType()).toBe(baseType);
            expect(event.getCreatedAt().toISOString()).toBe("2024-01-02T00:00:00.000Z");
            expect(event.getStreak()).toBe(3);
            expect(event.getEventReward()).toBeInstanceOf(EventReward);
        });

        test("returns error UserEvent for invalid event_type", () => {
            const plain = {
                id: "abc",
                user: baseUser,
                event_type: "NOT_REAL_TYPE",
                created_at: "2024-01-02",
                streak: 1,
                event_reward: {}
            };

            const event = UserEvent.fromPlainObject(plain);

            expect(event.getEventType()).toBe(UserEventTypes.ERROR.name);
        });

        test("returns error UserEvent for invalid created_at", () => {
            const plain = {
                id: "abc",
                user: baseUser,
                event_type: baseType,
                created_at: "this_is_not_a_date",
                streak: 1,
                event_reward: {}
            };

            const event = UserEvent.fromPlainObject(plain);

            expect(event.getEventType()).toBe(UserEventTypes.ERROR.name);
        });

        test("returns error UserEvent for missing/invalid structure", () => {
            const event = UserEvent.fromPlainObject(null as any);
            expect(event.getEventType()).toBe(UserEventTypes.ERROR.name);
        });
    });

    describe("Getters & Setters", () => {
        test("setters correctly update fields", () => {
            const event = new UserEvent(null, baseUser, baseType);

            event.setUser("newUser");
            event.setEventType(UserEventTypes.WEEKLY.name);
            event.setStreak(10);
            const newDate = new Date("2025-02-02");
            event.setCreatedAt(newDate);

            expect(event.getUser()).toBe("newUser");
            expect(event.getEventType()).toBe(UserEventTypes.WEEKLY.name);
            expect(event.getStreak()).toBe(10);
            expect(event.getCreatedAt()).toBe(newDate);
        });
    });

    describe("generateErrorUserEvent", () => {
        test("generates correct error event", () => {
            const evt = UserEvent.generateErrorUserEvent("badUser");

            expect(evt.getUser()).toBe("badUser");
            expect(evt.getEventType()).toBe(UserEventTypes.ERROR.name);
            expect(evt.getId()).toBeDefined();
        });
    });

    describe("toPlainObject", () => {
        test("exports all fields correctly", () => {
            const reward = new EventReward({
                eventType: baseType,
                userId: baseUser,
                inventoryId: "inv1",
                streak: 2,
                gold: 8,
                message: "msg"
            });

            const ev = new UserEvent("id777", baseUser, baseType, new Date("2024-05-01"), 2, reward);
            const plain = ev.toPlainObject();

            expect(plain.id).toBe("id777");
            expect(plain.user).toBe(baseUser);
            expect(plain.event_type).toBe(baseType);
            expect(plain.created_at).toBe("2024-05-01T00:00:00.000Z");
            expect(plain.streak).toBe(2);
            expect(plain.event_reward).toEqual(reward.toPlainObject());
        });
    });
});
