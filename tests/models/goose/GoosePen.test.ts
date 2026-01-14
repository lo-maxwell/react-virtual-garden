import Goose from "@/models/goose/Goose";
import GoosePen from "@/models/goose/GoosePen";
import { GoosePersonalities } from "@/models/goose/GoosePersonalities";
import GooseEgg from "@/models/goose/GooseEgg";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { GooseTransactionResponse } from "@/models/goose/GooseTransactionResponse";
import { InventoryTransactionResponse } from "@/models/itemStore/inventory/InventoryTransactionResponse";

function makeGoose(id: string) {
    return new Goose(
        id,
        `Goose-${id}`,
        "FFFFFF",
        Date.now(),
        10,
        10,
        GoosePersonalities.FRIENDLY.name,
        5,
        0
    );
}

function makeEgg(id: string) {
    return new GooseEgg(
        id,
        `Egg-${id}`
    );
}

describe("GoosePen", () => {

    let pen: GoosePen;

    beforeEach(() => {
        pen = new GoosePen("pen1", "user1", 3);
    });

    // ---------------------------------------------------------
    // BASIC GETTERS
    // ---------------------------------------------------------

    test("constructor sets fields correctly", () => {
        expect(pen.getId()).toBe("pen1");
        expect(pen.getOwner()).toBe("user1");
        expect(pen.getSize()).toBe(3);
    });

    // ---------------------------------------------------------
    // GOOSE CRUD
    // ---------------------------------------------------------

    test("addGoose adds a goose if there is space", () => {
        const g = makeGoose("A");
        expect(pen.addGoose(g)).toBe(true);
        expect(pen.getGooseCount()).toBe(1);
        expect(pen.getGooseById("A")).toEqual(g);
    });

    test("addGoose returns false if pen is full", () => {
        pen.addGoose(makeGoose("1"));
        pen.addGoose(makeGoose("2"));
        pen.addGoose(makeGoose("3"));

        expect(pen.addGoose(makeGoose("4"))).toBe(false);
    });

    test("getGooseById returns correct goose", () => {
        const g = makeGoose("X");
        pen.addGoose(g);

        expect(pen.getGooseById("X")).toEqual(g);
    });

    test("getGooseById returns undefined if goose not found", () => {
        expect(pen.getGooseById("nope")).toBeUndefined();
    });

    test("getAllGeese returns a copy, not internal array", () => {
        const g1 = makeGoose("1");
        pen.addGoose(g1);

        const arr = pen.getAllGeese();
        expect(arr).toEqual([g1]);

        arr.pop();
        expect(pen.getGooseCount()).toBe(1);
    });

    test("updateGoose replaces goose with same id", () => {
        const g = makeGoose("A");
        pen.addGoose(g);

        const updated = makeGoose("A");
        updated.setName("Updated");

        expect(pen.updateGoose(updated)).toBe(true);
        expect(pen.getGooseById("A")?.getName()).toBe("Updated");
    });

    test("updateGoose returns false if goose not found", () => {
        const g = makeGoose("missing");
        expect(pen.updateGoose(g)).toBe(false);
    });

    test("removeGoose removes goose by ID", () => {
        const g = makeGoose("A");
        pen.addGoose(g);

        expect(pen.removeGoose("A")).toBe(true);
        expect(pen.getGooseCount()).toBe(0);
        expect(pen.getGooseById("A")).toBeUndefined();
    });

    test("removeGoose returns false if goose not found", () => {
        expect(pen.removeGoose("404")).toBe(false);
    });

    test("hasSpace correctly reports space availability", () => {
        expect(pen.hasSpace()).toBe(true);

        pen.addGoose(makeGoose("1"));
        pen.addGoose(makeGoose("2"));
        pen.addGoose(makeGoose("3"));

        expect(pen.hasSpace()).toBe(false);
    });

    // ---------------------------------------------------------
    // PLAIN OBJECT CONVERSION (GOOSE)
    // ---------------------------------------------------------

    test("toPlainObject generates correct structure", () => {
        const g = makeGoose("A");
        pen.addGoose(g);

        const obj = pen.toPlainObject();

        expect(obj.id).toBe("pen1");
        expect(obj.owner).toBe("user1");
        expect(obj.size).toBe(3);
        expect(obj.geese.length).toBe(1);
        expect(obj.geese[0].id).toBe("A");
    });

    test("fromPlainObject recreates a GoosePen with geese", () => {
        const plain = {
            id: "pen20",
            owner: "user77",
            size: 5,
            geese: [
                {
                    id: "G1",
                    name: "TestGoose",
                    color: "ABCDEF",
                    birthday: 12345,
                    power: 1,
                    charisma: 2,
                    personality: GoosePersonalities.CURIOUS.name,
                    mood: 10,
                    location: 0,
                    status: 'active',
                    soldAt: null,
                    soldPrice: null
                },
            ],
            eggs: []
        };

        const pen2 = GoosePen.fromPlainObject(plain);

        expect(pen2.getId()).toBe("pen20");
        expect(pen2.getOwner()).toBe("user77");
        expect(pen2.getSize()).toBe(5);

        const g = pen2.getGooseById("G1");
        expect(g).toBeDefined();
        expect(g?.getName()).toBe("TestGoose");
    });

    test("fromPlainObject falls back on invalid input", () => {
        const pen = GoosePen.fromPlainObject(null);
        expect(pen.getId()).toBe("error");
        expect(pen.getOwner()).toBe("unknown");
        expect(pen.getSize()).toBe(0);
    });

    // ---------------------------------------------------------
    // EGG CRUD
    // ---------------------------------------------------------

    test("addEgg adds egg to pen", () => {
        const egg = makeEgg("E1");
        pen.addEgg(egg);

        expect(pen.getEggCount()).toBe(1);
        expect(pen.getEggById("E1")).toEqual(egg);
    });

    test("getEggById returns correct egg", () => {
        const egg = makeEgg("E2");
        pen.addEgg(egg);

        expect(pen.getEggById("E2")).toEqual(egg);
    });

    test("getEggById returns undefined for missing egg", () => {
        expect(pen.getEggById("missing")).toBeUndefined();
    });

    test("getAllEggs returns a defensive copy", () => {
        const egg = makeEgg("E3");
        pen.addEgg(egg);

        const eggs = pen.getAllEggs();

        expect(eggs).toEqual([egg]);

        eggs.pop();
        expect(pen.getEggCount()).toBe(1);
    });

    test("updateEgg replaces egg with same ID", () => {
        const egg = makeEgg("E4");
        pen.addEgg(egg);

        const updated = makeEgg("E4");
        updated.setName("Updated Egg");

        expect(pen.updateEgg(updated)).toBe(true);
        expect(pen.getEggById("E4")?.getName()).toBe("Updated Egg");
    });

    test("updateEgg returns false if egg not found", () => {
        const egg = makeEgg("missing");
        expect(pen.updateEgg(egg)).toBe(false);
    });

    test("removeEgg removes egg by id", () => {
        const egg = makeEgg("E5");
        pen.addEgg(egg);

        expect(pen.removeEgg("E5")).toBe(true);
        expect(pen.getEggCount()).toBe(0);
    });

    test("removeEgg returns false if egg not found", () => {
        expect(pen.removeEgg("404")).toBe(false);
    });

});

describe("GoosePen.expandGoosePen", () => {

    test("successfully expands pen when enough gold", () => {
        // Given
        const pen = new GoosePen("pen1", "user1", 10);
        const inventory = new Inventory('invId', 'userid', 10000); // enough gold

        // When
        const response = pen.expandGoosePen(inventory);

        // Then
        expect(response.isSuccessful()).toBe(true);

        // Payload should be the new size
        expect(response.payload).toBe(11);

        // Pen size actually updated
        expect(pen.getSize()).toBe(11);

        // Gold should be reduced by cost
        const cost = GoosePen.calculateExpansionCost(10);
        expect(inventory.getGold()).toBe(10000 - cost);
    });


    test("fails to expand pen when not enough gold", () => {
        // Given
        const pen = new GoosePen("pen1", "user1", 10);
        const inventory = new Inventory('invId', 'userid', 0); // not enough gold

        // When
        const response = pen.expandGoosePen(inventory);

        // Then
        expect(response.isSuccessful()).toBe(false);
        expect(response.payload).toBe(null);

        // Pen size should NOT change
        expect(pen.getSize()).toBe(10);

        // Gold stays the same
        expect(inventory.getGold()).toBe(0);

        // Error message is correct-ish
        expect(response.messages.length).toBe(1);
        expect(response.messages[0]).toMatch(/Cannot expand goose pen/i);
    });
});

describe("GoosePen.calculateExpansionCost", () => {

    test("cost is 0 when current size equals default size - 1", () => {
        const defaultSize = GoosePen.getDefaultGoosePenSize();

        // currentSize passed into the method is the *current* size
        // The formula uses: (currentSize + 1 - defaultSize) * 5000
        const cost = GoosePen.calculateExpansionCost(defaultSize - 1);

        expect(cost).toBe(0);
    });

    test("cost increases by 5000 for each size above default", () => {
        const defaultSize = GoosePen.getDefaultGoosePenSize();

        const size1 = defaultSize;       // first expansion
        const size2 = defaultSize + 1;   // second expansion
        const size3 = defaultSize + 2;   // third expansion

        expect(GoosePen.calculateExpansionCost(size1)).toBe(5000);
        expect(GoosePen.calculateExpansionCost(size2)).toBe(10000);
        expect(GoosePen.calculateExpansionCost(size3)).toBe(15000);
    });

    test("cost formula matches expected linear growth", () => {
        const defaultSize = GoosePen.getDefaultGoosePenSize();

        for (let size = defaultSize - 1; size < defaultSize + 10; size++) {
            const expected = (size + 1 - defaultSize) * 5000;
            expect(GoosePen.calculateExpansionCost(size)).toBe(expected);
        }
    });

    test("cost never returns a negative number", () => {
        // If someone passes a size much lower than expected
        const cost = GoosePen.calculateExpansionCost(0);
        expect(cost).toBeGreaterThanOrEqual(0);
    });

});

describe("GoosePen sellGoose & getActiveGeese", () => {

    let pen: GoosePen;
    let inventory: Inventory;

    beforeEach(() => {
        pen = new GoosePen("pen1", "user1", 5);
        inventory = new Inventory("inv1", "user1", 0);
    });

    test("getActiveGeese returns only unsold geese", () => {
        const g1 = makeGoose("G1");
        const g2 = makeGoose("G2");
        const g3 = makeGoose("G3");

        pen.addGoose(g1);
        pen.addGoose(g2);
        pen.addGoose(g3);

        g2.sell(g2.getSellPrice());

        const active = pen.getActiveGeese();
        expect(active.length).toBe(2);
        expect(active).toContain(g1);
        expect(active).toContain(g3);
        expect(active).not.toContain(g2);
    });

    test("sellGoose successfully sells a goose and adds gold", () => {
        const g1 = makeGoose("G1");
        pen.addGoose(g1);

        const goldBefore = inventory.getGold();
        const response = pen.sellGoose("G1", inventory);

        expect(response.isSuccessful()).toBe(true);
        expect(response.payload).toBe(g1.getSellPrice());

        expect(inventory.getGold()).toBe(goldBefore + g1.getSellPrice());
        expect(g1.isSold()).toBe(true);
        expect(pen.getActiveGeese()).not.toContain(g1);
    });

    test("sellGoose fails if goose does not exist", () => {
        const response = pen.sellGoose("missing", inventory);

        expect(response.isSuccessful()).toBe(false);
        expect(response.messages[0]).toMatch(/Could not find goose/i);
    });

    test("sellGoose fails if goose already sold", () => {
        const g1 = makeGoose("G1");
        pen.addGoose(g1);
        g1.sell(g1.getSellPrice());

        const response = pen.sellGoose("G1", inventory);

        expect(response.isSuccessful()).toBe(false);
        expect(response.messages[0]).toMatch(/already sold/i);
    });

    test("selling one goose does not affect others", () => {
        const g1 = makeGoose("G1");
        const g2 = makeGoose("G2");

        pen.addGoose(g1);
        pen.addGoose(g2);

        pen.sellGoose("G1", inventory);

        const active = pen.getActiveGeese();
        expect(active).toHaveLength(1);
        expect(active[0]).toBe(g2);
    });

});
