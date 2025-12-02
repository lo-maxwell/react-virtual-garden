import Goose from "./Goose";
import { v4 as uuidv4 } from 'uuid';
import GooseEgg from "./GooseEgg";

export interface GoosePenEntity {
    id: string;
    owner: string; // the user id
    size: number; // the maximum number of geese
}

class GoosePen {
    private id: string;
    private owner: string;
    private size: number;
	private geese: Goose[];
    private eggs: GooseEgg[];

    constructor(
        id: string,
        owner: string,
        size: number,
        geese: Goose[] = [],
        eggs: GooseEgg[] = []
    ) {
        this.id = id;
        this.owner = owner;
        this.size = size;
        this.geese = geese;
        this.eggs = eggs;
    }

    static fromPlainObject(plainObject: any): GoosePen {
        try {
            if (!plainObject || typeof plainObject !== "object") {
                throw new Error("Invalid plainObject structure for GoosePen");
            }

            const {
                id,
                owner,
                size,
                geese,
                eggs
            } = plainObject;

            if (typeof id !== "string") throw new Error("Invalid id");
            if (typeof owner !== "string") throw new Error("Invalid owner");
            if (typeof size !== "number") throw new Error("Invalid size");

            const hydratedGeese: Goose[] = Array.isArray(geese)
                ? geese.map((g: any) => Goose.fromPlainObject(g))
                : [];
            
            const hydratedEggs: GooseEgg[] = Array.isArray(eggs)
            ? eggs.map((e: any) => GooseEgg.fromPlainObject(e))
            : [];

            return new GoosePen(id, owner, size, hydratedGeese, hydratedEggs);
        } catch (err) {
            console.error("Error creating GoosePen from plainObject:", err);
            console.error("Original object:", plainObject);

            // Fallback pen
            return new GoosePen(
                "error",
                "unknown",
                0
            );
        }
    }

    toPlainObject(): any {
        return {
            id: this.id,
            owner: this.owner,
            size: this.size,
            geese: this.geese.map(g => g.toPlainObject()),
            eggs: this.eggs.map(e => e.toPlainObject())
        };
    }

    static generateDefaultGoosePen(owner: string): GoosePen {
        return new GoosePen(uuidv4(), owner, 1, []);
    }

    // ----------- GETTERS -----------
    getId(): string { return this.id; }
    getOwner(): string { return this.owner; }
    getSize(): number { return this.size; }

    // ----------- SETTERS -----------
    // setId(id: string): void { this.id = id; } // cannot change ID
    setOwner(owner: string): void { this.owner = owner; }
    setSize(size: number): void { this.size = size; }

    addGoose(goose: Goose): boolean {
        if (this.geese.length >= this.size) {
            return false; // pen full
        }

        this.geese.push(goose);
        return true;
    }

    getGooseById(id: string): Goose | undefined {
        return this.geese.find(g => g.getId() === id);
    }

    getAllGeese(): Goose[] {
        // return copy to avoid external mutation
        return this.geese.slice();
    }

    updateGoose(updatedGoose: Goose): boolean {
        const index = this.geese.findIndex(g => g.getId() === updatedGoose.getId());
        if (index === -1) {
            return false; // goose not found
        }
        this.geese[index] = updatedGoose;
        return true;
    }

    removeGoose(id: string): boolean {
        const index = this.geese.findIndex(g => g.getId() === id);

        if (index === -1) {
            return false; // not found
        }

        this.geese.splice(index, 1);
        return true;
    }

    hasSpace(): boolean {
        return this.geese.length < this.size;
    }

    getGooseCount(): number {
        return this.geese.length;
    }

    // ----------- EGG CRUD -----------

    addEgg(egg: GooseEgg): void {
        this.eggs.push(egg);
    }

    getEggById(id: string): GooseEgg | undefined {
        return this.eggs.find(e => e.getId() === id);
    }

    getAllEggs(): GooseEgg[] {
        return this.eggs.slice(); // return copy
    }

    updateEgg(updatedEgg: GooseEgg): boolean {
        const index = this.eggs.findIndex(e => e.getId() === updatedEgg.getId());
        if (index === -1) {
            return false; // egg not found
        }
        this.eggs[index] = updatedEgg;
        return true;
    }

    removeEgg(id: string): boolean {
        const index = this.eggs.findIndex(e => e.getId() === id);
        if (index === -1) {
            return false;
        }

        this.eggs.splice(index, 1);
        return true;
    }

    getEggCount(): number {
        return this.eggs.length;
    }

}

export default GoosePen;
