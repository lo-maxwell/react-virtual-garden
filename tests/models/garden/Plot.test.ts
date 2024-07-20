import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import { ItemTemplate, PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { generateNewPlaceholderInventoryItem, generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";

test('Should Initialize Plot Object', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	expect(newPlot).toBeTruthy();
	expect(newPlot.getItem().itemData.name).toBe("apple");
	expect(newPlot.getItemStatus()).toBe("newItem");
	newPlot.setItem(generateNewPlaceholderPlacedItem("banana", "new item"));
	newPlot.setItemStatus("old item");
	expect(newPlot.getItem().itemData.name).toBe("banana");
	expect(newPlot.getItemStatus()).toBe("old item");

})

test('Should Use Decoration Item And Replace', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("bench", "newItem"));
	const response = newPlot.useItem(generateNewPlaceholderPlacedItem("apple", "replaced"));
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(newPlot.getItemStatus()).toBe('replaced');
	expect(response.payload.newTemplate.name).toBe('bench blueprint');
})

test('Should Use Plant Item And Replace', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const response = newPlot.useItem(generateNewPlaceholderPlacedItem("banana", "replaced"));
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('banana');
	expect(newPlot.getItemStatus()).toBe('replaced');
	expect(response.payload.newTemplate.name).toBe('harvested apple');
})

test('Should Use And Replace With Ground', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const response = newPlot.useItem();
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(newPlot.getItemStatus()).toBe('');
	expect(response.payload.newTemplate.name).toBe('harvested apple');
})

test('Should Not Use EmptyItem Item', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("ground", "newItem"));
	const response = newPlot.useItem(generateNewPlaceholderPlacedItem("banana", "replaced"));
	expect(response.isSuccessful()).toBe(false);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(newPlot.getItemStatus()).toBe('newItem');
})

test('Should Not Use Item And Replace With InventoryItem', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const response = newPlot.useItem(new PlacedItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, "invalid"));
	expect(response.isSuccessful()).toBe(false);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(newPlot.getItemStatus()).toBe('newItem');
})


test('Should Place Apple Seed Item', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("ground", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList([generateNewPlaceholderInventoryItem('appleSeed', 1)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('apple seed').payload);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(response.payload.newItem.itemData.name).toBe('apple');
	expect(testInventory.contains('apple seed').payload).toBe(false);
})

test('Should Place Bench Item', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("ground", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList([generateNewPlaceholderInventoryItem('benchBlueprint', 2)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('bench blueprint').payload);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('bench');
	expect(response.payload.newItem.itemData.name).toBe('bench');
	expect(testInventory.contains('bench blueprint').payload).toBe(true);
	expect(testInventory.getItem('bench blueprint').payload.quantity).toBe(1);
})

test('Should Not Place on Non Ground', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList([generateNewPlaceholderInventoryItem('benchBlueprint', 2)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('bench blueprint').payload);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.contains('bench blueprint').payload).toBe(true);
	expect(testInventory.getItem('bench blueprint').payload.quantity).toBe(2);
})

test('Should Not Place Harvested Item', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("ground", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList([generateNewPlaceholderInventoryItem('harvestedApple', 1)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('harvested apple').payload);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Not Place Item With 0 Quantity', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("ground", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList([generateNewPlaceholderInventoryItem('appleSeed', 0)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('apple seed').payload);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Pickup Apple Item', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList([generateNewPlaceholderInventoryItem('harvestedApple', 1)]));
	const response = newPlot.pickupItem(testInventory, generateNewPlaceholderPlacedItem("ground", ""));
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(response.payload.newItem.itemData.name).toBe('harvested apple');
	expect(testInventory.contains('harvested apple').payload).toBe(true);
	expect(testInventory.getItem('harvested apple').payload.quantity).toBe(2);
})

test('Should Pickup Bench Item', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("bench", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList());
	const response = newPlot.pickupItem(testInventory);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(response.payload.newItem.itemData.name).toBe('bench blueprint');
	expect(testInventory.contains('bench blueprint').payload).toBe(true);
	expect(testInventory.getItem('bench blueprint').payload.quantity).toBe(1);
})

test('Should Not Pickup Non Plant/Decoration', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("ground", "newItem"));
	const testInventory = new Inventory("Dummy", 100, new ItemList([]));
	const response = newPlot.pickupItem(testInventory);
	expect(response.isSuccessful()).toBe(false);
	expect(newPlot.getItem().itemData.name).toBe("ground");
	expect(testInventory.size()).toBe(0);
})