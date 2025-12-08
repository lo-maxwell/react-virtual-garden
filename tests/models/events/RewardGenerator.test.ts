import { RewardGenerator } from "@/models/events/RewardGenerator";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";


describe("RewardGenerator", () => {
    test("constructor assigns properties correctly", () => {
        const items = new InventoryItemList();
        const gen = new RewardGenerator(items, 5, 3);

        expect(gen.getRewardItems()).toBe(items);
        expect(gen.getMaxQuantity()).toBe(5);
        expect(gen.getMaxItems()).toBe(3);
    });

    test("getters return correct values", () => {
        const items = new InventoryItemList();
        const gen = new RewardGenerator(items, 10, 4);

        expect(gen.getRewardItems()).toBe(items);
        expect(gen.getMaxQuantity()).toBe(10);
        expect(gen.getMaxItems()).toBe(4);
    });

    test("setters update internal values", () => {
        const itemsA = new InventoryItemList();
        const itemsB = new InventoryItemList();

        const gen = new RewardGenerator(itemsA, 2, 1);

        gen.setRewardItems(itemsB);
        gen.setMaxQuantity(50);
        gen.setMaxItems(7);

        expect(gen.getRewardItems()).toBe(itemsB);
        expect(gen.getMaxQuantity()).toBe(50);
        expect(gen.getMaxItems()).toBe(7);
    });
});
