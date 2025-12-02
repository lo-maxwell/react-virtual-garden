import Goose from "@/models/goose/Goose";
import GoosePen from "@/models/goose/GoosePen";
import { GoosePersonalities } from "@/models/goose/GoosePersonalities";
import GooseEgg from "@/models/goose/GooseEgg";

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
                    location: 0
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
