import Goose from "./Goose";
import { v4 as uuidv4 } from 'uuid';
import GooseEgg from "./GooseEgg";
import { Inventory } from "../itemStore/inventory/Inventory";
import { GooseTransactionResponse } from "./GooseTransactionResponse";

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

    static getDefaultGoosePenSize(): number {
        return 10;
    }

    static generateDefaultGoosePen(owner: string): GoosePen {
        return new GoosePen(uuidv4(), owner, GoosePen.getDefaultGoosePenSize(), []);
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
        if (this.getActiveGeese().length >= this.size) {
            return false; // pen full
        }

        this.geese.push(goose);
        return true;
    }

    getGooseById(id: string): Goose | undefined {
        return this.geese.find(g => g.getId() === id);
    }

    /**
     * Danger: returns all geese in the pen, regardless of their status
     */
    getAllGeese(): Goose[] {
        // return copy to avoid external mutation
        return this.geese.slice();
    }

    getActiveGeese(): Goose[] {
        return this.geese.filter(g => !g.isSold());
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
        return this.getActiveGeese().length < this.size;
    }

    getGooseCount(): number {
        return this.getActiveGeese().length;
    }

    /**
     * Cost is 5000 * (number of slots above 10 that you want)
     * ie. 5000 for 11th, 10000 for 12th, 15000 for 13th slot
     */
    static calculateExpansionCost(currentSize: number): number {
        return Math.max(0, (currentSize + 1 - GoosePen.getDefaultGoosePenSize()) * 5000);
    }

    /**
     * @param inventory the inventory to remove gold from
     * @returns response with payload of size of the new goose pen
     */
    expandGoosePen(inventory: Inventory): GooseTransactionResponse<number> {
        const response = new GooseTransactionResponse<number>();
        const cost = GoosePen.calculateExpansionCost(this.getSize());
        if (inventory.getGold() < cost) {
            response.addErrorMessage(`Cannot expand goose pen, needs ${cost} gold and has ${inventory.getGold()}`);
            return response;
        }
        inventory.removeGold(cost);
        this.setSize(this.getSize() + 1);
        response.payload = this.getSize();
        return response;
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

    /**
     * Sells a goose, removing it from the goose pen and adding gold to the inventory.
     * @param gooseId the id of the goose to remove from this pen
     * @param inventory the inventory to add gold to
     * @returns a GooseTransactionResponse with the amount of gold gained, if successful
     */
    sellGoose(gooseId: string, inventory: Inventory): GooseTransactionResponse<number> {
        const response = new GooseTransactionResponse<number>(0);
        const goose = this.getGooseById(gooseId);
        if (!goose) {
            response.addErrorMessage(`Could not find goose with id ${gooseId} in goosepen`);
            return response;
        }
        if (goose.isSold()) {
            response.addErrorMessage(`Cannot sell goose with id ${gooseId}: already sold`);
            return response;
        }
        const sellPrice = goose.getSellPrice();
        goose.sell(sellPrice);
        inventory.addGold(sellPrice);
        response.payload = sellPrice;
        return response;
    }

}

export default GoosePen;
