import { PlacedItemTemplate } from "./PlacedItemTemplate";
import { InventoryItemTemplate } from "./InventoryItemTemplate";
import { ItemTemplateRepository } from "./ItemTemplateRepository";
import { ItemTemplate } from "./ItemTemplate";

//Make this the factory

class PlaceholderItemTemplates {
	repository: ItemTemplateRepository;

	constructor() {
		this.repository = new ItemTemplateRepository();
	}

	/**
	 * @name the item name, ie apple. Note that there cannot be 2 placedItems with the same name, unless it is error
	 * @returns the found ItemTemplate or null
	 */
	getPlacedItemTemplateByName(name: string): PlacedItemTemplate | null {
		const placedItems = Object.values(this.repository.PlacedItems).flat().filter(item => item.name === name);
		if (placedItems.length === 1) return placedItems[0];
		else if (placedItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same name!');
			console.error(placedItems);
			return null;
		}
	}

	/**
	 * @name the item name, ie apple seed. Note that there cannot be 2 inventoryItems with the same name, unless it is error
	 * @returns the found ItemTemplate or null
	 */
	getInventoryItemTemplateByName(name: string): InventoryItemTemplate | null {
		// console.log(name);
		const inventoryItems = Object.values(this.repository.InventoryItems).flat().filter(item => item.name === name);
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
	 * Grabs the placedItemTemplate matching id
	 * Can return error templates
	 */
	getPlacedTemplate(id: string): PlacedItemTemplate | null {
		const placedItems = Object.values(this.repository.PlacedItems).flat().filter(item => item.id === id);
		if (placedItems.length === 1) return placedItems[0];
		else if (placedItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same id!');
			console.error(placedItems);
			return null;
		}
	}

	/**
	 * Placeholder, replace with grabbing from db later
	 * Grabs the inventoryItemTemplate matching id
	 * Can return error templates
	 */
	getInventoryTemplate(id: string): InventoryItemTemplate | null {
		const inventoryItems = Object.values(this.repository.InventoryItems).flat().filter(item => item.id === id);
		if (inventoryItems.length === 1) return inventoryItems[0];
		else if (inventoryItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same id!');
			console.error(inventoryItems);
			return null;
		}
	}

	/**
	 * Returns the template matching the id, can find both placed and inventory items
	 * @id the item identifier
	 */
	getTemplate(id: string): ItemTemplate | null{
		if (this.getInventoryTemplate(id)) {
			return this.getInventoryTemplate(id);
		} else {
			return this.getPlacedTemplate(id);
		}
	}
}


export const placeholderItemTemplates = new PlaceholderItemTemplates();