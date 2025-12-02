import { PlacedItem } from "./PlacedItem";
import { v4 as uuidv4 } from "uuid";
import { EggTemplate } from "../templates/models/PlacedItemTemplates/PlacedEggTemplate";
import { EggDetails, generateDefaultEggDetails } from "../EggDetails";

export class PlacedEgg extends PlacedItem {
    itemData: EggTemplate;
    eggDetails: EggDetails;

    constructor(
        placedItemId: string,
        itemData: EggTemplate,
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

            const validatedItemData = EggTemplate.fromPlainObject(itemData);

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
                EggTemplate.getErrorTemplate(),
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
