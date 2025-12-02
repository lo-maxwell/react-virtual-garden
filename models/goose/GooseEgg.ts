import { GoosePersonalities, GoosePersonality, isGoosePersonality } from "./GoosePersonalities";

export interface GooseEggEntity {
    id: string;
    owner: string; // the goose pen
}

//This is the inventory item equivalent
class GooseEgg {
    private id: string;
    private name: string;

    //should probably generate uuid
    constructor(
        id: string,
        name: string
    ) {
        this.id = id;
        this.name = name;
    }

    static fromPlainObject(plainObject: any): GooseEgg {
        try {
            if (!plainObject || typeof plainObject !== "object") {
                throw new Error("Invalid plainObject structure for GooseEgg");
            }

            const {
                id,
                name
            } = plainObject;

            if (typeof id !== "string") throw new Error("Invalid id");
            if (typeof name !== "string") throw new Error("Invalid name");

            return new GooseEgg(
                id,
                name
            );
        } catch (err) {
            console.error("Error creating GooseEgg from plainObject:", err);
            console.error("Original object:", plainObject);

            // Fallback default goose
            return new GooseEgg(
                "error",
                "Error Goose Egg"
            );
        }
    }

    toPlainObject(): any {
        return {
            id: this.id,
            name: this.name
        };
    }

	// ----------- GETTERS -----------
    getId(): string { return this.id; }
    getName(): string { return this.name; }

    // ----------- SETTERS -----------
    // setId(id: string): void { this.id = id; } //cannot change id of a goose egg
    setName(name: string): boolean { this.name = name; return true; }

    
}

export default GooseEgg;
