import Goose from "@/models/goose/Goose";
import { GoosePersonalities } from "@/models/goose/GoosePersonalities";

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
