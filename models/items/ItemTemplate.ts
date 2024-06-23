import { ItemSubtype, ItemType } from "./ItemTypes";

export class ItemTemplate {
	id: number;
	name: string;
	icon: string;
	type: ItemType;
	subtype: ItemSubtype;
	basePrice: number;
	transformId: number; //0 means it disappears after being used
	
	constructor(id: number, name: string, icon: string, type: ItemType, subtype: ItemSubtype, basePrice: number, transformId: number) {
		this.id = id;
		this.name = name;
		this.icon = icon;
		this.type = type;
		this.subtype = subtype;
		this.basePrice = basePrice;
		this.transformId = transformId;
	}

	getPrice(multiplier: number) {
		return Math.max(1, Math.floor(this.basePrice * multiplier + 0.5));
	}
}
interface PlaceHolderItems {
	[key: string]: ItemTemplate;
}

export class PlaceholderItemTemplates {
	static PlaceHolderItems: PlaceHolderItems = {
		errorPlacedItem: new ItemTemplate(-1, "error", "X", "PlacedItem", "Plant", 0, -1),
		errorInventoryItem: new ItemTemplate(-2, "error", "X", "InventoryItem", "Seed", 0, -2),
		ground: new ItemTemplate(1, "ground", ".", "PlacedItem", "Ground", 0, 1),
		appleSeed: new ItemTemplate(2, "apple seed", "!", "InventoryItem", "Seed", 10, 3),
		apple: new ItemTemplate(3, "apple", "!", "PlacedItem", "Plant", 50, 4),
		harvestedApple: new ItemTemplate(4, "harvested apple", "!", "InventoryItem", "HarvestedItem", 50, 0),
		bananaSeed: new ItemTemplate(5, "banana seed", "!", "InventoryItem", "Seed", 20, 6),
		banana: new ItemTemplate(6, "banana", "!", "PlacedItem", "Plant", 100, 7),
		harvestedBanana: new ItemTemplate(7, "harvested banana", "!", "InventoryItem", "HarvestedItem", 100, 0),
		coconutSeed: new ItemTemplate(8, "coconut seed", "!", "InventoryItem", "Seed", 30, 9),
		coconut: new ItemTemplate(9, "coconut", "!", "PlacedItem", "Plant", 150, 10),
		harvestedCoconut: new ItemTemplate(10, "harvested coconut", "!", "InventoryItem", "HarvestedItem", 150, 0),
		bench: new ItemTemplate(11, "bench", "B", "PlacedItem", "Decoration", 100, 12),
		benchBlueprint: new ItemTemplate(12, "bench blueprint", "B", "InventoryItem", "Blueprint", 100, 11),
	}
	
	
	/**
	 * Placeholder, replace with grabbing from db later
	 */
	static getTransformTemplate(transformId: number) {
		const items = Object.values(PlaceholderItemTemplates.PlaceHolderItems).filter(item => item.id === transformId);
		if (items.length > 0)
			return items[0];
		return null;
	}
}

