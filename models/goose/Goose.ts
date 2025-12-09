import { HarvestedItem } from "../items/inventoryItems/HarvestedItem";
import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "../items/ItemTypes";
import { HarvestedItemTemplate } from "../items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { InventoryItemTemplate } from "../items/templates/models/InventoryItemTemplates/InventoryItemTemplate";
import { Inventory } from "../itemStore/inventory/Inventory";
import { GoosePersonalities, GoosePersonality, isGoosePersonality } from "./GoosePersonalities";
import { GooseTransactionResponse } from "./GooseTransactionResponse";

export interface GooseEntity {
    id: string;
    owner: string;      // goose pen UUID
    name: string;
    color: string;      // 6-char hex code
    birthday: Date;

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
        location: number
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
                attributes = {}
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
    
            return new Goose(
                id,
                name,
                color,
                birthdayTimestamp,
                power,
                charisma,
                personality,
                mood,
                location
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
            }
        };
    }


    static fromEntity(entity: GooseEntity): Goose {
        const { id, name, color, birthday, attributes } = entity;
    
        return new Goose(
            id,
            name,
            color,
            birthday instanceof Date ? birthday.getTime() : Number(birthday),
            attributes?.power ?? 0,
            attributes?.charisma ?? 0,
            isGoosePersonality(attributes?.personality)
                ? attributes.personality
                : GoosePersonalities.ERROR.name,
            attributes?.mood ?? 0,
            attributes?.location ?? 0
        );
    }
    

    toEntity(owner: string): GooseEntity {
        return {
            id: this.id,
            owner,
            name: this.name,
            color: this.color,
            birthday: new Date(this.birthday),
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
     * Feeds a goose an item, increasing its mood. Decreases the inventory item's quantity by the respective amount.
     * @param inventory the inventory to consume the item from
     * @param item an InventoryItem. Fails if this is not a harvested item.
     * @param quantity the number of items to consume. Fails if this is larger than the existing quantity in the inventory.
     * @returns a GooseTransactionResponse with payload as the updated mood, if successful
     */
    feedGoose(inventory: Inventory, item: InventoryItemTemplate, quantity: number): GooseTransactionResponse {
        const response = new GooseTransactionResponse();

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
}

export default Goose;
