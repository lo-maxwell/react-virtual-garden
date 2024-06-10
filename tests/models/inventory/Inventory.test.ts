import { Inventory } from "@/models/inventory/Inventory";
import { ItemList } from "@/models/inventory/ItemList";
import { generateNewPlaceholderInventoryItem, PlaceHolderItems } from "@/models/items/PlaceholderItems";


let testInventory: Inventory;

beforeEach(() => {
	const item1 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const item2 = generateNewPlaceholderInventoryItem("bananaSeed", 2);
	const item3 = generateNewPlaceholderInventoryItem("coconutSeed", 3);
	const testItemList = new ItemList([item1, item2, item3]);
	testInventory = new Inventory("Test", 100, testItemList);
});

test('Should Initialize Default Inventory Object', () => {
	const inv = new Inventory("Dummy User", 100, new ItemList());
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.gold).toBe(100);
	expect(inv.userId).toBe("Dummy User");
	expect(inv.size()).toBe(0);
});

test('Should Find Item', () => {
	const getResponse = testInventory.get(PlaceHolderItems.appleSeed);
	expect(getResponse.isSuccessful()).toBe(true);
	expect(getResponse.payload.itemData.name).toBe('apple seed');
	const containsResponse = testInventory.contains(PlaceHolderItems.appleSeed);
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(true);
})

test('Should Not Find Nonexistent Item', () => {
	const getResponse = testInventory.get(PlaceHolderItems.harvestedApple);
	expect(getResponse.isSuccessful()).toBe(false);
	const containsResponse = testInventory.contains(PlaceHolderItems.harvestedApple);
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(false);
})

test('Should Gain Item To Inventory', () => {
	const response = testInventory.gainItem(PlaceHolderItems.harvestedApple, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.get(PlaceHolderItems.harvestedApple).payload.quantity).toBe(1);
	const response2 = testInventory.gainItem(PlaceHolderItems.harvestedApple, 3);
	expect(response2.isSuccessful()).toBe(true);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.get(PlaceHolderItems.harvestedApple).payload.quantity).toBe(4);
})

test('Should Not Gain Invalid Item', () => {
	expect(testInventory.size()).toBe(3);
	const response = testInventory.gainItem(PlaceHolderItems.harvestedApple, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	const response2 = testInventory.gainItem(PlaceHolderItems.harvestedApple, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	const response3 = testInventory.gainItem(PlaceHolderItems.apple, 1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
})

test('Should Trash Item From Inventory', () => {
	const response = testInventory.trashItem(PlaceHolderItems.appleSeed, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(0);
	expect(testInventory.size()).toBe(2);
	const response2 = testInventory.trashItem(PlaceHolderItems.bananaSeed, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.quantity).toBe(1);
	expect(testInventory.size()).toBe(2);
	expect(testInventory.get(PlaceHolderItems.bananaSeed).payload.quantity).toBe(1);
})

test('Should Not Trash Nonexistent Item From Inventory', () => {
	const response = testInventory.trashItem(PlaceHolderItems.harvestedApple, 1);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	const response2 = testInventory.trashItem(PlaceHolderItems.bananaSeed, 0);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	const response3 = testInventory.trashItem(PlaceHolderItems.coconutSeed, -1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
})

test('Should Buy Item', () => {
	const response = testInventory.buyItem(PlaceHolderItems.harvestedApple, 1, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload).toBe(50);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.contains(PlaceHolderItems.harvestedApple).payload).toBe(true);
	const response2 = testInventory.buyItem(generateNewPlaceholderInventoryItem("harvestedApple", 1), 1, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload).toBe(0);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.contains(PlaceHolderItems.harvestedApple).payload).toBe(true);
	expect(testInventory.get(PlaceHolderItems.harvestedApple).payload.quantity).toBe(2);
	expect(testInventory.gold).toBe(0);
})

test('Should Not Buy Expensive Item', () => {
	const response = testInventory.buyItem(PlaceHolderItems.harvestedApple, 1, 10);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	expect(testInventory.contains(PlaceHolderItems.harvestedApple).payload).toBe(false);
	expect(testInventory.gold).toBe(100);
})

test('Should Not Buy Invalid Item', () => {
	const response = testInventory.buyItem(PlaceHolderItems.apple, 1, 1);
	expect(response.isSuccessful()).toBe(false);
	const response2 = testInventory.buyItem(PlaceHolderItems.harvestedApple, 1, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.gold).toBe(100);
})

test('Should Sell Item', () => {
	const response = testInventory.sellItem(PlaceHolderItems.appleSeed, 1, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload).toBe(110);
	expect(testInventory.size()).toBe(2);
	expect(testInventory.contains(PlaceHolderItems.appleSeed).payload).toBe(false);
	const response2 = testInventory.sellItem(generateNewPlaceholderInventoryItem("bananaSeed", 1), 2, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload).toBe(150);
	expect(testInventory.size()).toBe(2);
	expect(testInventory.contains(PlaceHolderItems.bananaSeed).payload).toBe(true);
	expect(testInventory.get(PlaceHolderItems.bananaSeed).payload.quantity).toBe(1);
	const response3 = testInventory.sellItem(PlaceHolderItems.coconutSeed, 0.5, 2);
	expect(response3.isSuccessful()).toBe(true);
	expect(response3.payload).toBe(180);
	expect(testInventory.size()).toBe(2);
	expect(testInventory.contains(PlaceHolderItems.coconutSeed).payload).toBe(true);
	expect(testInventory.get(PlaceHolderItems.coconutSeed).payload.quantity).toBe(1);
	expect(testInventory.gold).toBe(180);
})

test('Should Not Sell Nonexistent Item', () => {
	const response = testInventory.sellItem(PlaceHolderItems.harvestedApple, 1, 1);
	expect(response.isSuccessful()).toBe(false);
	const response2 = testInventory.sellItem(PlaceHolderItems.appleSeed, 1, 2);
	expect(response2.isSuccessful()).toBe(false);
	const response3 = testInventory.sellItem(PlaceHolderItems.appleSeed, 1, -1);
	expect(response3.isSuccessful()).toBe(false);
	const response4 = testInventory.sellItem(PlaceHolderItems.apple, 1, 1);
	expect(response4.isSuccessful()).toBe(false);
	const response5 = testInventory.sellItem('not an item', 1, 1);
	expect(response5.isSuccessful()).toBe(false);
	expect(testInventory.gold).toBe(100);
})
