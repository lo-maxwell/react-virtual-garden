import { uuidv4 } from "@firebase/util";
import { HarvestedItem } from "../items/inventoryItems/HarvestedItem";
import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "../items/ItemTypes";
import { isPlacedEgg, PlacedEgg } from "../items/placedItems/PlacedEgg";
import { HarvestedItemTemplate } from "../items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { InventoryItemTemplate } from "../items/templates/models/InventoryItemTemplates/InventoryItemTemplate";
import { Inventory } from "../itemStore/inventory/Inventory";
import { GoosePersonalities, GoosePersonality, isGoosePersonality } from "./GoosePersonalities";
import { GooseTransactionResponse } from "./GooseTransactionResponse";

export const GOOSE_STATUSES = {
    ACTIVE: 'active',
    SOLD: 'sold',
} as const;

export type GooseStatus = typeof GOOSE_STATUSES[keyof typeof GOOSE_STATUSES];

export function isGooseStatus(value: unknown): value is GooseStatus {
    return Object.values(GOOSE_STATUSES).includes(value as GooseStatus);
}


export interface GooseEntity {
    id: string;
    owner: string;      // goose pen UUID
    name: string;
    color: string;      // 6-char hex code
    birthday: Date;
    status: GooseStatus;
    sold_at: Date | null;
    sold_price: number | null;

    // JSONB attributes
    attributes: {
        power?: number;
        charisma?: number;
        personality?: string;
        mood?: number;
        location?: number;

        // Allow future expansion with no migration
        [key: string]: any;
    };
}


class Goose {
    private id: string;
    private name: string;
    private color: string;
    private birthday: number;
    private power: number;
    private charisma: number;
    private personality: GoosePersonality;
    private mood: number;
    private location: number;

    private status: GooseStatus;
    private soldAt: number | null;
    private soldPrice: number | null;

    //should probably generate uuid
    constructor(
        id: string,
        name: string,
        color: string,
        birthday: number,
        power: number,
        charisma: number,
        personality: GoosePersonality,
        mood: number,
        location: number,

        status: GooseStatus = "active",
        soldAt: number | null = null,
        soldPrice: number | null = null
    ) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.birthday = birthday;
        this.power = power;
        this.charisma = charisma;
        this.personality = personality;
        this.mood = mood;
        this.location = location;
        this.status = status;
        this.soldAt = soldAt;
        this.soldPrice = soldPrice;
    }

    static fromPlainObject(plainObject: any): Goose {
        try {
            if (!plainObject || typeof plainObject !== "object") {
                throw new Error("Invalid plainObject structure for Goose");
            }

            const {
                id,
                name,
                color,
                birthday,
                attributes = {},
                status,
                soldAt = null,
                soldPrice = null
            } = plainObject;

            const {
                power = 0,
                charisma = 0,
                personality = GoosePersonalities.SHY.name,
                mood = 0,
                location = 0
            } = attributes;

            if (typeof id !== "string") throw new Error("Invalid id");
            if (typeof name !== "string") throw new Error("Invalid name");
            if (typeof color !== "string" || color.length != 6) throw new Error("Invalid color");

            let birthdayTimestamp: number;
            if (typeof birthday === "number") {
                birthdayTimestamp = birthday;
            } else if (birthday instanceof Date) {
                birthdayTimestamp = birthday.getTime();
            } else {
                throw new Error("Invalid birthday type");
            }

            if (!isGoosePersonality(personality)) {
                throw new Error("Invalid personality");
            }

            if (!isGooseStatus(status)) {
                throw new Error("Invalid status");
            }

            let soldAtTimestamp: number | null = null;
            if (soldAt instanceof Date) {
                soldAtTimestamp = soldAt.getTime();
            } else if (typeof soldAt === "number") {
                soldAtTimestamp = soldAt;
            } else if (typeof soldAt === "string") {
                const parsed = parseInt(soldAt, 10);
                if (!isNaN(parsed)) {
                    soldAtTimestamp = parsed;
                } else {
                    throw new Error("Invalid soldAt string format");
                }
            } else if (soldAt != null) {
                throw new Error(`Invalid soldAt type: ${typeof soldAt}, value: ${soldAt}`);
            }

            if (soldPrice != null && typeof soldPrice !== "number") {
                throw new Error("Invalid soldPrice");
            }

            return new Goose(
                id,
                name,
                color,
                birthdayTimestamp,
                power,
                charisma,
                personality,
                mood,
                location,
                status,
                soldAtTimestamp,
                soldPrice
            );
        } catch (err) {
            console.error("Error creating Goose from plainObject:", err);
            console.error("Original object:", plainObject);

            return new Goose(
                "error",
                "Error Goose",
                "FFFFFF",
                Date.now(),
                0,
                0,
                GoosePersonalities.ERROR.name,
                0,
                0
            );
        }
    }

    toPlainObject(): any {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            birthday: this.birthday,
            attributes: {
                power: this.power,
                charisma: this.charisma,
                personality: this.personality,
                mood: this.mood,
                location: this.location
            },
            status: this.status,
            soldAt: this.soldAt !== null ? new Date(this.soldAt) : null,
            soldPrice: this.soldPrice,
        };
    }


    static fromEntity(entity: GooseEntity): Goose {
        return Goose.fromPlainObject({
            ...entity,
            soldAt: entity.sold_at,
            soldPrice: entity.sold_price
        });
    }


    toEntity(owner: string): GooseEntity {
        return {
            id: this.id,
            owner,
            name: this.name,
            color: this.color,
            birthday: new Date(this.birthday),
            status: this.status,
            sold_at: this.soldAt !== null ? new Date(this.soldAt) : null,
            sold_price: this.soldPrice,
            attributes: {
                power: this.power,
                charisma: this.charisma,
                personality: this.personality,
                mood: this.mood,
                location: this.location
            }
        };
    }

    // ----------- GETTERS -----------
    getId(): string { return this.id; }
    getName(): string { return this.name; }
    getColor(): string { return this.color; }
    getBirthday(): number { return this.birthday; }
    getPower(): number { return this.power; }
    getCharisma(): number { return this.charisma; }
    getPersonality(): GoosePersonality { return this.personality; }
    getMood(): number { return this.mood; }
    getLocation(): number { return this.location; }

    // ----------- SETTERS -----------
    // setId(id: string): void { this.id = id; } //cannot change id of a goose
    setName(name: string): boolean { this.name = name; return true; }
    setBirthday(birthday: number): boolean { this.birthday = birthday; return true; }
    setColor(color: string): boolean {
        if (color.length !== 6) return false;
        this.color = color;
        return true;
    }
    setPower(power: number): boolean { this.power = power; return true; }
    setCharisma(charisma: number): boolean { this.charisma = charisma; return true; }
    setPersonality(personality: GoosePersonality): boolean { this.personality = personality; return true; }
    setMood(mood: number): boolean { this.mood = mood; return true; }
    setLocation(location: number): boolean { this.location = location; return true; }

    getMoodChangeFromItem(item: HarvestedItemTemplate): number {
        if (item.subtype !== ItemSubtypes.HARVESTED.name) {
            throw new Error(`Invalid item`);
        }
        const itemValue = item.value;

        return Math.floor(itemValue / 10) + 1;
    }

    /**
     * The gold price of this goose if you sell it
     */
    getSellPrice(): number {
        const power = Math.max(0, this.getPower() ?? 0);
        const charisma = Math.max(0, this.getCharisma() ?? 0);

        // Mood is capped at 100 and normalized to 0–1
        const mood = Math.min(100, Math.max(0, this.getMood() ?? 0));
        const moodMultiplier = 0.5 + (mood / 100) * 0.5; // 0.5 → 1.0

        /**
         * Base value from stats
         * - Linear contribution
         */
        const baseStatValue =
            power * 20 +
            charisma * 20;

        /**
         * Synergy bonus:
         * - Rewards high power + charisma together
         * - Quadratic growth but bounded
         */
        const synergy =
            Math.sqrt(power * charisma) * 50;

        /**
         * Final price
         */
        const rawPrice = (baseStatValue + synergy) * moodMultiplier;

        // Floor, round, and clamp to avoid negative / fractional nonsense
        return Math.max(0, Math.floor(rawPrice));
    }

    /**
     * Feeds a goose an item, increasing its mood. Decreases the inventory item's quantity by the respective amount.
     * @param inventory the inventory to consume the item from
     * @param item an InventoryItem. Fails if this is not a harvested item.
     * @param quantity the number of items to consume. Fails if this is larger than the existing quantity in the inventory.
     * @returns a GooseTransactionResponse with payload as the updated mood, if successful
     */
    feedGoose(inventory: Inventory, item: InventoryItemTemplate, quantity: number): GooseTransactionResponse<number | null> {
        const response = new GooseTransactionResponse<number>();

        if (item.subtype !== ItemSubtypes.HARVESTED.name) {
            response.addErrorMessage(`Invalid item of type ${item.subtype} for feeding`);
            return response;
        }
        const getItemResponse = inventory.getItem(item);
        const itemFromInventory = getItemResponse.payload;
        if (!getItemResponse.isSuccessful() || !itemFromInventory) {
            response.addErrorMessages(getItemResponse.messages.length ? getItemResponse.messages : [`Could not find ${item.name} in inventory`]);
            return response;
        }
        const inventoryQuantity = itemFromInventory.getQuantity();
        if (inventoryQuantity < quantity) {
            response.addErrorMessage(`Invalid quantity of ${item.name} in inventory, has ${inventoryQuantity} and needs ${quantity}`);
            return response;
        }
        const trashItemResponse = inventory.trashItem(itemFromInventory, quantity);
        if (!trashItemResponse.isSuccessful()) {
            response.addErrorMessages(trashItemResponse.messages);
            return response;
        }
        try {
            const moodChange = this.getMoodChangeFromItem(itemFromInventory.itemData);
            this.setMood(moodChange + this.getMood());
            response.payload = this.getMood();
            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            response.addErrorMessage(msg);
            return response;
        }
    }

    isSold(): boolean {
        return this.status === "sold";
    }

    sell(price: number): boolean {
        if (this.isSold()) return false;

        this.status = "sold";
        this.soldAt = Date.now();
        this.soldPrice = Math.max(0, Math.floor(price));

        return true;
    }
}

export default Goose;
