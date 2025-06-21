import { generateInventoryItem, generatePlacedItem, generateRandomInventoryItem, generateRandomPlacedItem } from "@/models/items/ItemFactory";

test('Should Generate PlacedItem', () => {
	const placedItem = generatePlacedItem("apple", "");
	expect(placedItem).toBeTruthy();
	expect(placedItem.itemData.name).toBe("apple");

	const placedItem2 = generatePlacedItem("banana", "");
	expect(placedItem2).toBeTruthy();
	expect(placedItem2.itemData.name).toBe("banana");

	const placedItem3 = generatePlacedItem("coconut", "");
	expect(placedItem3).toBeTruthy();
	expect(placedItem3.itemData.name).toBe("coconut");

	for (let i = 0; i < 100; i++) {
		const placedItem4 = generateRandomPlacedItem();
		expect(placedItem4).toBeTruthy();
		expect(placedItem4.itemData.type).toBe("PlacedItem");
	}
});

test('Should Generate Error PlacedItem', () => {
	const placedItem = generatePlacedItem("invalid name", "");
	expect(placedItem).toBeTruthy();
	expect(placedItem.itemData.name).toBe("error");
});

test('Should Generate InventoryItem', () => {
	const inventoryItem = generateInventoryItem("apple seed", 0);
	expect(inventoryItem).toBeTruthy();
	expect(inventoryItem.itemData.name).toBe("apple seed");

	const inventoryItem2 = generateInventoryItem("banana seed", 0);
	expect(inventoryItem2).toBeTruthy();
	expect(inventoryItem2.itemData.name).toBe("banana seed");

	const inventoryItem3 = generateInventoryItem("coconut", 0);
	expect(inventoryItem3).toBeTruthy();
	expect(inventoryItem3.itemData.name).toBe("coconut");

	for (let i = 0; i < 100; i++) {
		const inventoryItem4 = generateRandomInventoryItem();
		expect(inventoryItem4).toBeTruthy();
		expect(inventoryItem4.itemData.type).toBe("InventoryItem");
	}
});

test('Should Generate Error InventoryItem', () => {
	const inventoryItem = generateInventoryItem("invalid name", 0);
	expect(inventoryItem).toBeTruthy();
	expect(inventoryItem.itemData.name).toBe("error");
});