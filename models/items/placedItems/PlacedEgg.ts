import { PlacedItem } from "./PlacedItem";
import { v4 as uuidv4 } from "uuid";
import { PlacedEggTemplate } from "../templates/models/PlacedItemTemplates/PlacedEggTemplate";
import { EggDetails, generateDefaultEggDetails } from "../EggDetails";

export function isPlacedEgg(raw: any): raw is {
    placedItemId: string;
    status: string;
    itemData: any;
    eggDetails: EggDetails;
} {
    return validatePlacedEgg(raw).valid;
}

function validatePlacedEgg(raw: any): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!raw || typeof raw !== "object") {
        return {
            valid: false,
            errors: ["PlacedEgg must be an object"]
        };
    }

    // placedItemId
    if (typeof raw.placedItemId !== "string" || raw.placedItemId.length === 0) {
        errors.push("placedItemId must be a non-empty string");
    }

    // status
    if (typeof raw.status !== "string" || raw.status.length === 0) {
        errors.push("status must be a non-empty string");
    }

    // itemData
    if (!raw.itemData || typeof raw.itemData !== "object") {
        errors.push("itemData must be an object");
    } else {
        try {
            PlacedEggTemplate.fromPlainObject(raw.itemData);
        } catch {
            errors.push("itemData is not a valid PlacedEggTemplate");
        }
    }

    // eggDetails
    if (!raw.eggDetails || typeof raw.eggDetails !== "object") {
        errors.push("eggDetails must be an object");
    } else {
        // minimal structural validation
        // (tighten this if EggDetails evolves)
        if (Object.keys(raw.eggDetails).length === 0) {
            errors.push("eggDetails must not be empty");
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export class PlacedEgg extends PlacedItem {
    itemData: PlacedEggTemplate;
    eggDetails: EggDetails;

    constructor(
        placedItemId: string,
        itemData: PlacedEggTemplate,
        status: string,
        eggDetails: EggDetails
    ) {
        super(placedItemId, itemData, status);
        this.itemData = itemData;
        this.eggDetails = eggDetails;
    }

    static fromPlainObject(plainObject: any): PlacedEgg {
        try {
            if (!plainObject || typeof plainObject !== "object") {
                throw new Error("Invalid plainObject structure for PlacedEgg");
            }

            const { placedItemId, itemData, status, eggDetails } = plainObject;

            if (typeof placedItemId !== "string") throw new Error("Invalid placedItemId");
            if (typeof status !== "string") throw new Error("Invalid status");
            if (typeof eggDetails !== "object") throw new Error("Invalid eggDetails");

            const validatedItemData = PlacedEggTemplate.fromPlainObject(itemData);

            return new PlacedEgg(
                placedItemId,
                validatedItemData,
                status,
                eggDetails
            );

        } catch (err) {
            console.error("Error creating PlacedEgg from plainObject:", err);
            return new PlacedEgg(
                uuidv4(),
                PlacedEggTemplate.getErrorTemplate(),
                "error",
                generateDefaultEggDetails()
            );
        }
    }

    toPlainObject(): any {
        return {
            placedItemId: this.placedItemId,
            status: this.status,
            itemData: this.itemData.toPlainObject(),
            eggDetails: this.eggDetails
        };
    }
}
