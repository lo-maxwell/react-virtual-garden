import { InventoryItem } from "./InventoryItem";
import { v4 as uuidv4 } from "uuid";
import { InventoryEggTemplate } from "../templates/models/InventoryItemTemplates/InventoryEggTemplate";
import { EggDetails, generateDefaultEggDetails } from "../EggDetails";

export class InventoryEgg extends InventoryItem {
    itemData: InventoryEggTemplate;
    eggDetails: EggDetails;

    constructor(
        inventoryItemId: string,
        itemData: InventoryEggTemplate,
        quantity: number,
        eggDetails: EggDetails
    ) {
        super(inventoryItemId, itemData, quantity);
        this.itemData = itemData;
        this.eggDetails = eggDetails;
    }

    static fromPlainObject(plainObject: any): InventoryEgg {
        try {
            if (!plainObject || typeof plainObject !== "object") {
                throw new Error("Invalid plainObject structure for InventoryEgg");
            }

            const { inventoryItemId, itemData, quantity, eggDetails } = plainObject;

            if (typeof inventoryItemId !== "string") throw new Error("Invalid inventoryItemId");
            if (typeof quantity !== "number") throw new Error("Invalid quantity");
            if (typeof eggDetails !== "object") throw new Error("Invalid eggDetails");

            const validatedItemData = InventoryEggTemplate.fromPlainObject(itemData);

            return new InventoryEgg(
                inventoryItemId,
                validatedItemData,
                quantity,
                eggDetails
            );

        } catch (err) {
            console.error("Error creating InventoryEgg from plainObject:", err);
            return new InventoryEgg(
                uuidv4(),
                InventoryEggTemplate.getErrorTemplate(),
                1,
                generateDefaultEggDetails()
            );
        }
    }

    toPlainObject(): any {
        return {
            inventoryItemId: this.inventoryItemId,
            quantity: this.quantity,
            itemData: this.itemData.toPlainObject(),
            eggDetails: this.eggDetails
        };
    }
}

