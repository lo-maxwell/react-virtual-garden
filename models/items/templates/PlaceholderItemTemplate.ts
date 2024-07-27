import { ItemTemplate } from "./ItemTemplate";
import itemsData from '../../../data/items/items.json';
import { PlantTemplate } from "./PlantTemplate";
import { DecorationTemplate } from "./DecorationTemplate";
import { EmptyItemTemplate } from "./EmptyItemTemplate";
import { SeedTemplate } from "./SeedTemplate";
import { HarvestedItemTemplate } from "./HarvestedItemTemplate";
import { BlueprintTemplate } from "./BlueprintTemplate";
import { PlacedItemTemplate } from "./PlacedItemTemplate";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

class PlaceholderItemTemplates {
	static PlacedItems: Record<string, PlacedItemTemplate[]> = {};
	static InventoryItems: Record<string, InventoryItemTemplate[]> = {};

  static loadItems() {
    // Example to load PlacedItems > Plants
    PlaceholderItemTemplates.PlacedItems['Plants'] = itemsData.PlacedItems.Plants.map((item: any) =>
      new PlantTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.value,
        item.transformId,
        item.baseExp // Optional
      )
    );
	PlaceholderItemTemplates.PlacedItems['Decorations'] = itemsData.PlacedItems.Decorations.map((item: any) =>
      new DecorationTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.value,
        item.transformId,
      )
    );
	PlaceholderItemTemplates.PlacedItems['Ground'] = itemsData.PlacedItems.Ground.map((item: any) =>
      new EmptyItemTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.value,
        item.transformId
      )
    );
	PlaceholderItemTemplates.InventoryItems['Seeds'] = itemsData.InventoryItems.Seeds.map((item: any) =>
      new SeedTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.value,
        item.transformId
      )
    );
	PlaceholderItemTemplates.InventoryItems['HarvestedItems'] = itemsData.InventoryItems.HarvestedItems.map((item: any) =>
      new HarvestedItemTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.value
      )
    );
	PlaceholderItemTemplates.InventoryItems['Blueprints'] = itemsData.InventoryItems.Blueprints.map((item: any) =>
      new BlueprintTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.value,
        item.transformId
      )
    );
	// console.log('loading placeholders');
	// console.log(PlaceholderItemTemplates.PlacedItems);
	// console.log(PlaceholderItemTemplates.InventoryItems);
    // Repeat for other categories if needed
  	}

	/**
	 * @param name the item name, ie apple. Note that there cannot be 2 placedItems with the same name, unless it is error
	 * @returns the found ItemTemplate or an error ItemTemplate
	 */
	static getPlacedItemTemplateByName(name: string): PlacedItemTemplate | null {
		const placedItems = Object.values(PlaceholderItemTemplates.PlacedItems).flat().filter(item => item.name === name);
		if (placedItems.length === 1) return placedItems[0];
		else if (placedItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same name!');
			console.error(placedItems);
			return null;
		}
	}

	/**
	 * @param name the item name, ie apple seed. Note that there cannot be 2 inventoryItems with the same name, unless it is error
	 * @returns the found ItemTemplate or an error ItemTemplate
	 */
	static getInventoryItemTemplateByName(name: string): InventoryItemTemplate | null {
		const inventoryItems = Object.values(PlaceholderItemTemplates.InventoryItems).flat().filter(item => item.name === name);
		if (inventoryItems.length === 1) return inventoryItems[0];
		else if (inventoryItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same name!');
			console.error(inventoryItems);
			return null;
		}
	}
	

	//Write tests for these
	//Why is it null
	//TODO: Do we need to specify the returned value is correct template type?
	/**
	 * Placeholder, replace with grabbing from db later
	 * Grabs the placedItemTemplate matching transformId
	 */
	static getPlacedTransformTemplate(transformId: string): PlacedItemTemplate | null {
		const placedItems = Object.values(PlaceholderItemTemplates.PlacedItems).flat().filter(item => item.id === transformId);
		
		if (placedItems.length === 1) return placedItems[0];
		else if (placedItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same transformid!');
			console.error(placedItems);
			return null;
		}
	}

	/**
	 * Placeholder, replace with grabbing from db later
	 * Grabs the inventoryItemTemplate matching transformId
	 */
	 static getInventoryTransformTemplate(transformId: string): InventoryItemTemplate | null {
		const inventoryItems = Object.values(PlaceholderItemTemplates.InventoryItems).flat().filter(item => item.id === transformId);
		if (inventoryItems.length === 1) return inventoryItems[0];
		else if (inventoryItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same transformid!');
			console.error(inventoryItems);
			return null;
		}
	}
}


// Load items when the module is imported
PlaceholderItemTemplates.loadItems();

export default PlaceholderItemTemplates;