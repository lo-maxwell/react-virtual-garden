import { PlacedItemTemplate } from "./PlacedItemTemplates/PlacedItemTemplate";
import { ItemTemplateRepository } from "./ItemTemplateRepository";
import { ItemTemplate } from "./ItemTemplate";
import { InventoryItemTemplate } from "./InventoryItemTemplates/InventoryItemTemplate";
import ToolTemplate from "./ToolTemplates/ToolTemplate";

//Make this the factory

class ItemTemplateFactory {
	repository: ItemTemplateRepository;

	constructor() {
		this.repository = new ItemTemplateRepository();
	}

	/**
	 * @name the item name, ie apple. Note that there cannot be 2 placedItems with the same name, unless it is error. Not case sensitive.
	 * @returns the found ItemTemplate or null
	 */
	getPlacedItemTemplateByName(name: string): PlacedItemTemplate | null {
		const placedItems = Object.values(this.repository.PlacedItems).flat().filter(item => (item.name).toLowerCase() === (name).toLowerCase());
		if (placedItems.length === 1) return placedItems[0];
		else if (placedItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same name!');
			console.error(placedItems);
			return null;
		}
	}

	/**
	 * @name the item name, ie apple seed. Note that there cannot be 2 inventoryItems with the same name, unless it is error. Not case sensitive.
	 * @returns the found ItemTemplate or null
	 */
	getInventoryItemTemplateByName(name: string): InventoryItemTemplate | null {
		const inventoryItems = Object.values(this.repository.InventoryItems).flat().filter(item => (item.name).toLowerCase() === (name).toLowerCase());
		if (inventoryItems.length === 1) return inventoryItems[0];
		else if (inventoryItems.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same name!');
			console.error(inventoryItems);
			return null;
		}
	}

	/**
	 * @name the tool name, ie. Basic Axe. Not case sensitive.
	 * @returns the found ToolTemplate or null
	 */
	 getToolTemplateByName(name: string): ToolTemplate | null {
		const tools = Object.values(this.repository.Tools).flat().filter(tool => (tool.name).toLowerCase() === (name).toLowerCase());
		if (tools.length === 1) return tools[0];
		else if (tools.length === 0) return null;
		else {
			console.error('Error: found multiple tools with the same name!');
			console.error(tools);
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
	getPlacedTemplateById(id: string): PlacedItemTemplate | null {
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
	getInventoryTemplateById(id: string): InventoryItemTemplate | null {
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
	 * Placeholder, replace with grabbing from db later
	 * Grabs the toolTemplate matching id
	 * Can return error templates
	 */
	getToolTemplateById(id: string): ToolTemplate | null {
		const tools = Object.values(this.repository.Tools).flat().filter(tool => tool.id === id);
		if (tools.length === 1) return tools[0];
		else if (tools.length === 0) return null;
		else {
			console.error('Error: found multiple items with the same id!');
			console.error(tools);
			return null;
		}
	}

	/**
	 * Returns the template matching the id, can find placed, inventory, or tool items
	 * @id the item identifier
	 */
	getTemplateById(id: string): ItemTemplate | ToolTemplate | null{
		if (this.getInventoryTemplateById(id)) {
			return this.getInventoryTemplateById(id);
		} else if (this.getPlacedTemplateById(id)) {
			return this.getPlacedTemplateById(id);
		} else {
			return this.getToolTemplateById(id);
		}
	}


}


export const itemTemplateFactory = new ItemTemplateFactory();