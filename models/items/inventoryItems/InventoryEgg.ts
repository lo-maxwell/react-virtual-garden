import { InventoryItem } from "./InventoryItem";
import { v4 as uuidv4 } from "uuid";
import { InventoryEggTemplate } from "../templates/models/InventoryItemTemplates/InventoryEggTemplate";
import { EggDetails, generateDefaultEggDetails } from "../EggDetails";
import { InventoryTransactionResponse } from "@/models/itemStore/inventory/InventoryTransactionResponse";
import { ItemTemplate } from "../templates/models/ItemTemplate";
import { itemTemplateFactory } from "../templates/models/ItemTemplateFactory";

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

    static isInventoryEgg(raw: any): raw is InventoryEgg {
        if (!raw || typeof raw !== "object") {
            return false;
        }
    
        // Required base fields
        if (typeof raw.inventoryItemId !== "string") return false;
        if (typeof raw.quantity !== "number") return false;
        if (raw.quantity < 0) return false;
    
        // itemData must exist and be a valid InventoryEggTemplate shape
        if (!raw.itemData || typeof raw.itemData !== "object") return false;
        if (typeof raw.itemData.subtype !== "string") return false;
    
        // Must be egg subtype
        if (raw.itemData.subtype !== "InventoryEgg") {
            return false;
        }
    
        // Egg details
        if (!raw.eggDetails || typeof raw.eggDetails !== "object") return false;
    
        return true;
    }

    copyEggDetails(): EggDetails {
        // structuredClone is ideal if available (Node 17+, modern browsers)
        if (typeof structuredClone === "function") {
            return structuredClone(this.eggDetails);
        }
    
        // Fallback for older environments
        return JSON.parse(JSON.stringify(this.eggDetails));
    }

    /**
	 * Sets the quantity of this item to 0, then returns the template of the new item.
	 * Fails if the item had non 1 quantity.
	 * @returns a response containing the following object, or an error message
	 * {originalItem: InventoryEgg
	 *  newTemplate: ItemTemplate}
	 */
    override use(quantity: number = 1): InventoryTransactionResponse<{
		originalItem: InventoryEgg;
		newTemplate: ItemTemplate;
	} | null> {
		const response = new InventoryTransactionResponse<{
			originalItem: InventoryEgg;
			newTemplate: ItemTemplate;
		}>();

		// Eggs must always be quantity 1
		if (this.quantity !== 1) {
			response.addErrorMessage("Inventory egg has invalid quantity");
			return response;
		}

		const template = itemTemplateFactory.getPlacedTemplateById(
			this.itemData.transformId
		);

		if (!template) {
			response.addErrorMessage("Invalid egg transform template");
			return response;
		}

		// Consume egg entirely
		this.setQuantity(0);

		response.payload = {
			originalItem: this,
			newTemplate: template
		};

		return response;
	}
}

