import { Blueprint } from "../inventoryItems/Blueprint";
import { HarvestedItem } from "../inventoryItems/HarvestedItem";
import { InventoryItem } from "../inventoryItems/InventoryItem";
import { Seed } from "../inventoryItems/Seed";
import { ItemType, ItemTypes } from "../ItemTypes";
import { Decoration } from "../placedItems/Decoration";
import { EmptyItem } from "../placedItems/EmptyItem";
import { PlacedItem } from "../placedItems/PlacedItem";
import { Plant } from "../placedItems/Plant";
import { BlueprintTemplate } from "../templates/models/BlueprintTemplate";
import { DecorationTemplate } from "../templates/models/DecorationTemplate";
import { EmptyItemTemplate } from "../templates/models/EmptyItemTemplate";
import { HarvestedItemTemplate } from "../templates/models/HarvestedItemTemplate";
import { InventoryItemTemplate } from "../templates/models/InventoryItemTemplate";
import { ItemTemplate } from "../templates/models/ItemTemplate";
import { PlacedItemTemplate } from "../templates/models/PlacedItemTemplate";
import { PlantTemplate } from "../templates/models/PlantTemplate";
import { SeedTemplate } from "../templates/models/SeedTemplate";

export type ItemConstructor<T extends InventoryItem | PlacedItem> = {
    new (...args: any[]): T;
    fromPlainObject(plainObject: any): T; // Static method example
    // Add other static methods if necessary
};

export const itemTypeMap: { [key: string]: ItemConstructor<InventoryItem | PlacedItem>} = {
	'Seed': Seed,
	'Blueprint': Blueprint,
	'HarvestedItem': HarvestedItem,
	'Plant': Plant,
	'Decoration': Decoration,
	'Ground': EmptyItem
}

export type ItemTemplateConstructor<T extends InventoryItemTemplate | PlacedItemTemplate> = {
    new (...args: any[]): T;
    fromPlainObject(plainObject: any): T; // Static method example
    // Add other static methods if necessary
};

export const itemTemplateMap: { [key: string]: ItemTemplateConstructor<InventoryItemTemplate | PlacedItemTemplate>} = {
	'Seed': SeedTemplate,
	'Blueprint': BlueprintTemplate,
	'HarvestedItem': HarvestedItemTemplate,
	'Plant': PlantTemplate,
	'Decoration': DecorationTemplate,
	'Ground': EmptyItemTemplate
}

/**
 * Get the Class given an item. Can be used as a constructor.
 * @param item - InventoryItem, PlacedItem, or Template
 * @returns the Item Class
 */
export const getItemClassFromSubtype = (item: InventoryItem | PlacedItem | ItemTemplate): ItemConstructor<InventoryItem | PlacedItem> => {
	let ItemClass;
	if (item instanceof ItemTemplate) {
		ItemClass = itemTypeMap[item.subtype];
		if (!ItemClass) {
			throw new Error(`Unknown item subtype: ${item.subtype}`);
		}
	} else {
		ItemClass = itemTypeMap[item.itemData.subtype];
		if (!ItemClass) {
			throw new Error(`Unknown item subtype: ${item.itemData.subtype}`);
		}
	}
	return ItemClass as ItemConstructor<InventoryItem | PlacedItem>;
} 


/**
 * Get the Template given an item. Can be used as a constructor.
 * @param item - InventoryItem, PlacedItem, or Template
 * @returns the Item Template
 */
 export const getItemTemplateFromSubtype = (item: InventoryItemTemplate | PlacedItemTemplate): ItemTemplateConstructor<InventoryItemTemplate | PlacedItemTemplate> => {
	let ItemClass = itemTemplateMap[item.subtype];
	if (!ItemClass) throw new Error(`Unknown item subtype: ${item.subtype}`);
	return ItemClass as ItemTemplateConstructor<InventoryItemTemplate | PlacedItemTemplate>;
} 