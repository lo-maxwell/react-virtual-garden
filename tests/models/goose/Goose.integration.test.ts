import Goose from "@/models/goose/Goose";
import { GoosePersonalities } from "@/models/goose/GoosePersonalities";
import { generateInventoryItem } from "@/models/items/ItemFactory";
import { ItemSubtype } from "@/models/items/ItemTypes";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";

describe("Goose.feedGoose Integration – modifies real Inventory", () => {

    function makeInventoryWithHarvestedItem(itemName: string, quantity: number, value = 20) {
        // override template values (if template has different base value)
        const harvested = generateInventoryItem(itemName, quantity);
        harvested.itemData.value = value; // ensure predictable test calculations

        const items = new InventoryItemList([harvested]);
        return new Inventory("inv1", "Tester", 0, items);
    }

    test("feeding a goose reduces inventory item quantity and increases mood", () => {
        // mood change for value=20 → floor(20/10) + 1 = 3
        const g = new Goose(
            "g1",
            "Henry",
            "FFFFFF",
            123,
            0,
            0,
            GoosePersonalities.SHY.name,
            50,
            0
        );

        const inv = makeInventoryWithHarvestedItem("apple", 5, 20);

        const itemTemplate = generateInventoryItem("apple", 1).itemData; // template reference

        const res = g.feedGoose(inv, itemTemplate, 2);

        // --- Assertions ---
        expect(res.isSuccessful()).toBe(true);

        // Mood increased correctly
        expect(res.payload).toBe(50 + 3); 

        // Inventory now contains 5 - 2 = 3 apples
        const updated = inv.getItem(itemTemplate).payload;
        expect(updated.getQuantity()).toBe(3);
    });

    test("feeding exactly consumes all items", () => {
        const g = new Goose(
            "g2",
            "Lucy",
            "AAAAAA",
            111,
            0,
            0,
            GoosePersonalities.LAZY.name,
            10,
            0
        );

        const inv = makeInventoryWithHarvestedItem("apple", 2, 10); // moodChange = floor(10/10)+1 = 2
        const itemTemplate = generateInventoryItem("apple", 1).itemData;

        const res = g.feedGoose(inv, itemTemplate, 2);

        expect(res.isSuccessful()).toBe(true);
        expect(res.payload).toBe(12); // 10 + 2

        const updated = inv.getItem(itemTemplate).payload;
        expect(updated.getQuantity()).toBe(0);
    });

    test("feeding fails when insufficient quantity, inventory unchanged", () => {
        const g = new Goose(
            "g3",
            "Bob",
            "CCCCCC",
            999,
            0,
            0,
            GoosePersonalities.FRIENDLY.name,
            80,
            0
        );

        const inv = makeInventoryWithHarvestedItem("apple", 1, 20);
        const itemTemplate = generateInventoryItem("apple", 1).itemData;

        const res = g.feedGoose(inv, itemTemplate, 5);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages[0]).toMatch(/Invalid quantity/);

        // Confirm no changes happened
        const updated = inv.getItem(itemTemplate).payload;
        expect(updated.getQuantity()).toBe(1);

        // Mood untouched
        expect(g.getMood()).toBe(80);
    });

    test("feeding fails if item is not HARVESTED type", () => {
        const g = new Goose("id", "Test", "FFFFFF", 0, 0, 0, GoosePersonalities.SHY.name, 10, 0);
        
        // Add a SEED, not harvestable
        const seed = generateInventoryItem("apple seed", 3);
        const inv = new Inventory("inv", "Tester", 0, new InventoryItemList([seed]));

        const res = g.feedGoose(inv, seed.itemData, 1);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages[0]).toMatch(/Invalid item of type/);

        // Confirm inventory untouched
        const updated = inv.getItem(seed.itemData).payload;
        expect(updated.getQuantity()).toBe(3);
    });

    test("error inside getMoodChangeFromItem is caught and mood not changed", () => {
        const g = new Goose("id", "Test", "FFFFFF", 0, 0, 0, GoosePersonalities.SHY.name, 10, 0);

        // Correct subtype in template but wrong subtype in actual item retrieved
        const invItem = generateInventoryItem("apple", 2);
        invItem.itemData.subtype = "seed" as ItemSubtype; // Force error

        const inv = new Inventory(
            "inv", 
            "Tester", 
            0, 
            new InventoryItemList([invItem])
        );

        const appleTemplate = generateInventoryItem("apple", 1).itemData;

        const res = g.feedGoose(inv, appleTemplate, 1);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages[0]).toMatch(/Invalid item/);

        // Mood unchanged
        expect(g.getMood()).toBe(10);

        // Quantity unchanged
        const updated = inv.getItem(invItem);
        expect(updated.isSuccessful()).toBeTruthy();
        expect(updated.payload.getQuantity()).toBe(2);
    });
});
