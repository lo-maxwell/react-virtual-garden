import { generateNewPlaceholderInventoryItem, generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";

test('Should Generate PlacedItem', () => {
	const placedItem = generateNewPlaceholderPlacedItem("apple", "");
	expect(placedItem).toBeTruthy();
	expect(placedItem.itemData.name).toBe("apple");

	const placedItem2 = generateNewPlaceholderPlacedItem("banana", "");
	expect(placedItem2).toBeTruthy();
	expect(placedItem2.itemData.name).toBe("banana");

	const placedItem3 = generateNewPlaceholderPlacedItem("coconut", "");
	expect(placedItem3).toBeTruthy();
	expect(placedItem3.itemData.name).toBe("coconut");
});

test('Should Generate Error PlacedItem', () => {
	const placedItem = generateNewPlaceholderPlacedItem("invalid name", "");
	expect(placedItem).toBeTruthy();
	expect(placedItem.itemData.name).toBe("error");
});

test('Should Generate InventoryItem', () => {
	const inventoryItem = generateNewPlaceholderInventoryItem("appleSeed", 0);
	expect(inventoryItem).toBeTruthy();
	expect(inventoryItem.itemData.name).toBe("apple seed");

	const inventoryItem2 = generateNewPlaceholderInventoryItem("bananaSeed", 0);
	expect(inventoryItem2).toBeTruthy();
	expect(inventoryItem2.itemData.name).toBe("banana seed");

	const inventoryItem3 = generateNewPlaceholderInventoryItem("coconutSeed", 0);
	expect(inventoryItem3).toBeTruthy();
	expect(inventoryItem3.itemData.name).toBe("coconut seed");
});

test('Should Generate Error InventoryItem', () => {
	const inventoryItem = generateNewPlaceholderInventoryItem("invalid name", 0);
	expect(inventoryItem).toBeTruthy();
	expect(inventoryItem.itemData.name).toBe("error");
});