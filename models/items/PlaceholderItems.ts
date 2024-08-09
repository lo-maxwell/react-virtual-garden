import { Blueprint } from "./inventoryItems/Blueprint";
import { HarvestedItem } from "./inventoryItems/HarvestedItem";
import { Seed } from "./inventoryItems/Seed";
import { Decoration } from "./placedItems/Decoration";
import { EmptyItem } from "./placedItems/EmptyItem";
import { Plant } from "./placedItems/Plant";
import { BlueprintTemplate } from "./templates/models/BlueprintTemplate";
import { DecorationTemplate } from "./templates/models/DecorationTemplate";
import { EmptyItemTemplate } from "./templates/models/EmptyItemTemplate";
import { HarvestedItemTemplate } from "./templates/models/HarvestedItemTemplate";
import { placeholderItemTemplates } from "./templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "./templates/models/PlantTemplate";
import { SeedTemplate } from "./templates/models/SeedTemplate";

export const generateRandomPlaceholderPlacedItem = () => {
	const placedItems = Object.values(placeholderItemTemplates.repository.PlacedItems).flat().filter(item => item.name != "error");
	return generateNewPlaceholderPlacedItem(placedItems[Math.floor(Math.random() * placedItems.length)].name, "autogenerated");
}

export const generateRandomPlaceholderInventoryItem = () => {
	const inventoryItems = Object.values(placeholderItemTemplates.repository.InventoryItems).flat().filter(item => item.name != "error");
	return generateNewPlaceholderInventoryItem(inventoryItems[Math.floor(Math.random() * inventoryItems.length)].name, 1);
}


/**
 * @param itemName - the item name ie. apple
 * @param status - the status string
 */
export const generateNewPlaceholderPlacedItem = (itemName: string, status: string) => {
	const itemData = placeholderItemTemplates.getPlacedItemTemplateByName(itemName);
	if (!itemData) return new EmptyItem(EmptyItemTemplate.getErrorTemplate(), '');
	switch (itemData.subtype) {
		case "Plant":
			//TODO: Replace type assertion with type guard
			//But this is placeholder stuff so dont worry about it too much
			const plantItemData = itemData as PlantTemplate;
			return new Plant(plantItemData, status);
		case "Decoration":
			const decorationItemData = itemData as DecorationTemplate;
			return new Decoration(decorationItemData, status);
		case "Ground":
			const emptyItemData = itemData as EmptyItemTemplate;
			return new EmptyItem(emptyItemData, status);
		default:
			console.log('Could not find item, generating error item.');
			return new EmptyItem(EmptyItemTemplate.getErrorTemplate(), '');
	}
}

/**
 * @param itemName - the item name, ie. apple seed
 * @param quantity - the quantity
 */
export const generateNewPlaceholderInventoryItem = (itemName: string, quantity: number) => {
	const itemData = placeholderItemTemplates.getInventoryItemTemplateByName(itemName);
	if (!itemData) return new Seed(SeedTemplate.getErrorTemplate(), 1);
	switch (itemData.subtype) {
		case "Seed":
			//TODO: Replace type assertion with type guard
			//But this is placeholder stuff so dont worry about it too much
			const seedItemData = itemData as SeedTemplate;
			return new Seed(seedItemData, quantity);
		case "Blueprint":
			const blueprintItemData = itemData as BlueprintTemplate;
			return new Blueprint(blueprintItemData, quantity);
		case "HarvestedItem":
			const harvestedItemData = itemData as HarvestedItemTemplate;
			return new HarvestedItem(harvestedItemData, quantity);
		default:
			console.log('Could not find item, generating error item.');
			return new Seed(SeedTemplate.getErrorTemplate(), 1);
	}
}
