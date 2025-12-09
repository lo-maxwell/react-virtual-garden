import Goose from "@/models/goose/Goose";
import { GoosePersonalities } from "@/models/goose/GoosePersonalities";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";

function makeHarvestedItem(value: number): HarvestedItem {
    return {
        itemData: {
            subtype: ItemSubtypes.HARVESTED.name,
            value
        }
    } as unknown as HarvestedItem;
}

// Mock InventoryItemTemplate
function makeTemplate(subtype: string, name = "TestItem") {
    return {
        subtype,
        name
    } as any;
}

// Mock InventoryItem
function makeInventoryItem(quantity: number, value: number) {
    return {
        getQuantity: () => quantity,
        itemData: {
            subtype: ItemSubtypes.HARVESTED.name,
            value
        }
    };
}

// Mock Inventory object for dependency injection
function makeInventory({
    itemFound = true,
    quantity = 5,
    value = 20,
    trashSuccess = true
} = {}) {
    return {
        getItem: jest.fn().mockReturnValue(itemFound
            ? { isSuccessful: () => true, payload: makeInventoryItem(quantity, value), messages: [] }
            : { isSuccessful: () => false, payload: null, messages: ["Item not found"] }
        ),
        trashItem: jest.fn().mockReturnValue(trashSuccess
            ? { isSuccessful: () => true, messages: [] }
            : { isSuccessful: () => false, messages: ["Could not trash item"] }
        )
    };
}

describe("Goose", () => {

    test("constructs with valid values", () => {
        const g = new Goose(
            "g1",
            "Henry",
            "FFAA00",
            123456789,
            10,
            15,
            GoosePersonalities.LAZY.name,
            50,
            0
        );

        expect(g.getId()).toBe("g1");
        expect(g.getName()).toBe("Henry");
        expect(g.getColor()).toBe("FFAA00");
        expect(g.getBirthday()).toBe(123456789);
        expect(g.getPower()).toBe(10);
        expect(g.getCharisma()).toBe(15);
        expect(g.getPersonality()).toBe(GoosePersonalities.LAZY.name);
        expect(g.getMood()).toBe(50);
        expect(g.getLocation()).toBe(0);
    });

    // --------------------------------
    // fromPlainObject hydration tests
    // --------------------------------

    test("fromPlainObject hydrates correctly from nested attributes", () => {
        const obj = {
            id: "g9",
            name: "Lucy",
            color: "112233",
            birthday: 11111,
            attributes: {
                power: 7,
                charisma: 3,
                personality: GoosePersonalities.FRIENDLY.name,
                mood: 90,
                location: 0
            }
        };

        const g = Goose.fromPlainObject(obj);

        expect(g.getId()).toBe("g9");
        expect(g.getName()).toBe("Lucy");
        expect(g.getColor()).toBe("112233");
        expect(g.getBirthday()).toBe(11111);
        expect(g.getPower()).toBe(7);
        expect(g.getCharisma()).toBe(3);
        expect(g.getPersonality()).toBe(GoosePersonalities.FRIENDLY.name);
        expect(g.getMood()).toBe(90);
        expect(g.getLocation()).toBe(0);
    });

    test("fromPlainObject fails gracefully and returns fallback goose", () => {
        const g = Goose.fromPlainObject(null);

        expect(g.getId()).toBe("error");
        expect(g.getName()).toBe("Error Goose");
        expect(g.getColor()).toBe("FFFFFF");
        expect(g.getPower()).toBe(0);
        expect(g.getCharisma()).toBe(0);
        expect(g.getPersonality()).toBe(GoosePersonalities.ERROR.name);
    });

    test("fromPlainObject rejects invalid color length", () => {
        const obj = {
            id: "bad",
            name: "Broken",
            color: "FFF", // invalid
            birthday: 10,
            attributes: {
                power: 1,
                charisma: 1,
                personality: GoosePersonalities.LAZY.name,
                mood: 10,
                location: 0
            }
        };

        const g = Goose.fromPlainObject(obj);
        expect(g.getId()).toBe("error");
    });

    test("fromPlainObject rejects invalid personality", () => {
        const obj = {
            id: "bad",
            name: "Broken",
            color: "FFFFFF",
            birthday: 10,
            attributes: {
                power: 1,
                charisma: 1,
                personality: "NOT_VALID",
                mood: 10,
                location: 0
            }
        };

        const g = Goose.fromPlainObject(obj);
        expect(g.getId()).toBe("error");
    });

    // ------------------------
    // toPlainObject tests
    // ------------------------

    test("toPlainObject serializes correctly into attributes", () => {
        const g = new Goose(
            "x1",
            "Benny",
            "A1B2C3",
            1000,
            5,
            6,
            GoosePersonalities.AGGRESSIVE.name,
            22,
            0
        );

        expect(g.toPlainObject()).toEqual({
            id: "x1",
            name: "Benny",
            color: "A1B2C3",
            birthday: 1000,
            attributes: {
                power: 5,
                charisma: 6,
                personality: GoosePersonalities.AGGRESSIVE.name,
                mood: 22,
                location: 0
            }
        });
    });

    // ------------------------
    // Setter tests
    // ------------------------

    test("setColor validates hex length", () => {
        const g = new Goose("1", "A", "FFFFFF", 0, 0, 0, GoosePersonalities.LAZY.name, 0, 0);

        expect(g.setColor("ABCDEF")).toBe(true);
        expect(g.getColor()).toBe("ABCDEF");

        expect(g.setColor("FFF")).toBe(false);
        expect(g.getColor()).toBe("ABCDEF"); // unchanged
    });

    test("all other setters assign directly", () => {
        const g = new Goose("1", "OldName", "FFFFFF", 111, 10, 10, GoosePersonalities.LAZY.name, 50, 0);

        g.setName("NewName");
        g.setBirthday(222);
        g.setPower(99);
        g.setCharisma(77);
        g.setMood(5);
        g.setLocation(5);
        g.setPersonality(GoosePersonalities.SHY.name);

        expect(g.getName()).toBe("NewName");
        expect(g.getBirthday()).toBe(222);
        expect(g.getPower()).toBe(99);
        expect(g.getCharisma()).toBe(77);
        expect(g.getMood()).toBe(5);
        expect(g.getLocation()).toBe(5);
        expect(g.getPersonality()).toBe(GoosePersonalities.SHY.name);
    });
});

describe("Goose.getMoodChangeFromItem", () => {
    test("returns floor(value/10)+1 for valid harvested items", () => {
        const g = new Goose("1", "A", "FFFFFF", 0, 0, 0, GoosePersonalities.SHY.name, 50, 0);

        const item = makeHarvestedItem(35); // floor(35/10)+1 = 4
        const result = g.getMoodChangeFromItem(item.itemData);

        expect(result).toBe(4);
    });

    test("throws an error for non-harvested items", () => {
        const g = new Goose("1", "A", "FFFFFF", 0, 0, 0, GoosePersonalities.SHY.name, 50, 0);

        const badItem = {
            itemData: { subtype: "SEED", value: 10 }
        } as any;

        expect(() => g.getMoodChangeFromItem(badItem.itemData)).toThrow("Invalid item");
    });
});

describe("Goose.feedGoose", () => {

    test("fails if item subtype is not HARVESTED", () => {
        const g = new Goose("1","A","FFFFFF",0,0,0,GoosePersonalities.SHY.name,50,0);
        const inv = makeInventory();
        const template = makeTemplate("SEED");

        const res = g.feedGoose(inv as any, template, 1);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages[0]).toMatch(/Invalid item/);
    });

    test("fails if item is not found in inventory", () => {
        const g = new Goose("1","A","FFFFFF",0,0,0,GoosePersonalities.SHY.name,50,0);

        const inv = makeInventory({ itemFound: false });
        const template = makeTemplate(ItemSubtypes.HARVESTED.name);

        const res = g.feedGoose(inv as any, template, 1);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages.join()).toMatch(/Item not found|Could not find/);
    });

    test("fails if inventory has less than required quantity", () => {
        const g = new Goose("1","A","FFFFFF",0,0,0,GoosePersonalities.SHY.name,50,0);

        const inv = makeInventory({ quantity: 1 });
        const template = makeTemplate(ItemSubtypes.HARVESTED.name);

        const res = g.feedGoose(inv as any, template, 5);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages[0]).toMatch(/Invalid quantity/);
    });

    test("fails if trashItem fails", () => {
        const g = new Goose("1","A","FFFFFF",0,0,0,GoosePersonalities.SHY.name,50,0);

        const inv = makeInventory({ trashSuccess: false });
        const template = makeTemplate(ItemSubtypes.HARVESTED.name);

        const res = g.feedGoose(inv as any, template, 1);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages[0]).toMatch(/Could not trash item/);
    });

    test("successfully feeds and increases mood", () => {
        const g = new Goose("1","A","FFFFFF",0,0,0,GoosePersonalities.SHY.name,50,0);

        // value: 20 → moodChange = floor(20/10)+1 = 3
        const inv = makeInventory({ quantity: 5, value: 20 });
        const template = makeTemplate(ItemSubtypes.HARVESTED.name);

        const res = g.feedGoose(inv as any, template, 1);

        expect(res.isSuccessful()).toBe(true);
        expect(res.payload).toBe(53);
    });

    test("catches and returns error if getMoodChangeFromItem throws", () => {
        const g = new Goose("1","A","FFFFFF",0,0,0,GoosePersonalities.SHY.name,50,0);

        const inv = makeInventory({ value: 20 });

        // Force an invalid item subtype AFTER retrieval
        inv.getItem = jest.fn().mockReturnValue({
            isSuccessful: () => true,
            payload: { itemData: { subtype: "NOT_HARVESTED", value: 20 }, getQuantity: () => 5 },
            messages: []
        });

        const template = makeTemplate(ItemSubtypes.HARVESTED.name);

        const res = g.feedGoose(inv as any, template, 1);

        expect(res.isSuccessful()).toBe(false);
        expect(res.messages[0]).toMatch(/Invalid item/);
    });
});