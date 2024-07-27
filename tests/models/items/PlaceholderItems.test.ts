import { generateNewPlaceholderInventoryItem, generateNewPlaceholderPlacedItem, generateRandomPlaceholderInventoryItem, generateRandomPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";

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

	for (let i = 0; i < 100; i++) {
		const placedItem4 = generateRandomPlaceholderPlacedItem();
		expect(placedItem4).toBeTruthy();
		expect(placedItem4.itemData.type).toBe("PlacedItem");
	}
});

test('Should Generate Error PlacedItem', () => {
	const placedItem = generateNewPlaceholderPlacedItem("invalid name", "");
	expect(placedItem).toBeTruthy();
	expect(placedItem.itemData.name).toBe("error");
});

test('Should Generate InventoryItem', () => {
	const inventoryItem = generateNewPlaceholderInventoryItem("apple seed", 0);
	expect(inventoryItem).toBeTruthy();
	expect(inventoryItem.itemData.name).toBe("apple seed");

	const inventoryItem2 = generateNewPlaceholderInventoryItem("banana seed", 0);
	expect(inventoryItem2).toBeTruthy();
	expect(inventoryItem2.itemData.name).toBe("banana seed");

	const inventoryItem3 = generateNewPlaceholderInventoryItem("harvested coconut", 0);
	expect(inventoryItem3).toBeTruthy();
	expect(inventoryItem3.itemData.name).toBe("harvested coconut");

	for (let i = 0; i < 100; i++) {
		const inventoryItem4 = generateRandomPlaceholderInventoryItem();
		expect(inventoryItem4).toBeTruthy();
		expect(inventoryItem4.itemData.type).toBe("InventoryItem");
	}
});

test('Should Generate Error InventoryItem', () => {
	const inventoryItem = generateNewPlaceholderInventoryItem("invalid name", 0);
	expect(inventoryItem).toBeTruthy();
	expect(inventoryItem.itemData.name).toBe("error");
});