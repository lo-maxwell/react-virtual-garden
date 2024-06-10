import { ItemList } from "@/models/inventory/ItemList";
import { generateNewPlaceholderInventoryItem, generateRandomPlaceholderInventoryItem, PlaceHolderItems } from "@/models/items/PlaceholderItems";

let testItemList: ItemList;
	

beforeEach(() => {
	const item1 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const item2 = generateNewPlaceholderInventoryItem("bananaSeed", 2);
	const item3 = generateNewPlaceholderInventoryItem("coconutSeed", 3);
	testItemList = new ItemList([item1, item2, item3]);
});

test('Should Initialize Default ItemList Object', () => {
	const inv = new ItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
});

test('Should Get Existing Item', () => {
	const appleSeed = testItemList.get('apple seed');
	expect(appleSeed.payload.itemData.name).toBe('apple seed');
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.get(PlaceHolderItems.bananaSeed);
	expect(bananaSeed.payload.itemData.name).toBe('banana seed');
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.get(generateNewPlaceholderInventoryItem("coconutSeed", 1));
	expect(coconutSeed.payload.itemData.name).toBe('coconut seed');
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Not Get Nonexistent Item', () => {
	const response = testItemList.get('not a real item');
	expect(response.isSuccessful()).toBe(false);
	expect(response.payload).toBeNull();
	const response2 = testItemList.get(PlaceHolderItems.harvestedBanana.name);
	expect(response2.isSuccessful()).toBe(false);
	expect(response2.payload).toBeNull();
	const response3 = testItemList.get(PlaceHolderItems.banana);
	expect(response3.isSuccessful()).toBe(false);
	expect(response3.payload).toBeNull();
});

test('Should Check Contains Existing Item', () => {
	const appleSeed = testItemList.contains('apple seed');
	expect(appleSeed.payload).toBe(true);
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.contains(PlaceHolderItems.bananaSeed);
	expect(bananaSeed.payload).toBe(true);
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.contains(generateNewPlaceholderInventoryItem("coconutSeed", 1));
	expect(coconutSeed.payload).toBe(true);
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Check Does Not Contain Nonexistent Item', () => {
	const response = testItemList.contains('harvested apple');
	expect(response.payload).toBe(false);
	expect(response.isSuccessful()).toBe(true);
	const response2 = testItemList.contains(PlaceHolderItems.harvestedBanana);
	expect(response2.payload).toBe(false);
	expect(response2.isSuccessful()).toBe(true);
	const response3 = testItemList.contains('not a real item');
	expect(response3.payload).toBe(false);
	expect(response3.isSuccessful()).toBe(true);
});

test('Should Check Contains Amount of Existing Item', () => {
	const appleSeed = testItemList.containsAmount('apple seed', 1);
	expect(appleSeed.payload).toBe(true);
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.containsAmount(PlaceHolderItems.bananaSeed, 2);
	expect(bananaSeed.payload).toBe(true);
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.containsAmount(generateNewPlaceholderInventoryItem("coconutSeed", 1), 1);
	expect(coconutSeed.payload).toBe(true);
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Check Does Not Contain Amount of Lacking Item', () => {
	const appleSeed = testItemList.containsAmount('apple seed', 2);
	expect(appleSeed.payload).toBe(false);
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.containsAmount(PlaceHolderItems.bananaSeed, 0);
	expect(bananaSeed.isSuccessful()).toBe(false);
	const coconutSeed = testItemList.containsAmount(generateNewPlaceholderInventoryItem("coconutSeed", 1), -1);
	expect(coconutSeed.isSuccessful()).toBe(false);
});

test('Should Check Does Not Contain Amount of Nonexistent Item', () => {
	const response = testItemList.containsAmount('harvested apple', 1);
	expect(response.payload).toBe(false);
	expect(response.isSuccessful()).toBe(true);
	const response2 = testItemList.containsAmount(PlaceHolderItems.harvestedBanana, 2);
	expect(response2.payload).toBe(false);
	expect(response2.isSuccessful()).toBe(true);
	const response3 = testItemList.containsAmount('not a real item', 3);
	expect(response3.payload).toBe(false);
	expect(response3.isSuccessful()).toBe(true);
});

test('Should Add Item to List', () => {
	const inv = new ItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
	inv.addItem(generateRandomPlaceholderInventoryItem(), 1);
	expect(inv.size()).toBe(1);
});

test('Should Add New Item If Not Existing', () => {
	const inv = new ItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	const response = inv.addItem(generateNewPlaceholderInventoryItem("appleSeed", 1), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(PlaceHolderItems.bananaSeed, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(2);
	expect(inv.get("apple seed").payload.quantity).toBe(1);
	expect(inv.get("banana seed").payload.quantity).toBe(2);
});

test('Should Not Add Invalid Item', () => {
	const response = testItemList.addItem(PlaceHolderItems.harvestedApple, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response2 = testItemList.addItem(PlaceHolderItems.harvestedApple, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response3 = testItemList.addItem(PlaceHolderItems.apple, 1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
})

test('Should Update Quantity When Adding Item', () => {
	const inv = new ItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
	const response = inv.addItem(generateNewPlaceholderInventoryItem("appleSeed", 1), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(PlaceHolderItems.appleSeed, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	expect(inv.get("apple seed").payload.quantity).toBe(3);
});

test('Should Not Add Invalid Quantity', () => {
	const response = testItemList.addItem(PlaceHolderItems.appleSeed, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.get('apple seed').payload.quantity).toBe(1);
	const response2 = testItemList.addItem(generateNewPlaceholderInventoryItem("bananaSeed", 1), -2);
	expect(response2.isSuccessful()).toBe(false);
	expect(testItemList.get('banana seed').payload.quantity).toBe(2);
	const response3 = testItemList.addItem(generateNewPlaceholderInventoryItem("harvestedApple", 1), 0);
	expect(response3.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response4 = testItemList.addItem(generateNewPlaceholderInventoryItem("harvestedBanana", 1), -1);
	expect(response4.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
});

test('Should Update Quantity of Existing Item', () => {
	const response = testItemList.updateQuantity('apple seed', 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(2);
	const response2 = testItemList.updateQuantity(PlaceHolderItems.bananaSeed, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.quantity).toBe(4);
	const response3 = testItemList.updateQuantity(generateNewPlaceholderInventoryItem('coconutSeed', 1), -1);
	expect(response3.isSuccessful()).toBe(true);
	expect(response3.payload.quantity).toBe(2);
});

test('Should Delete When Updating Quantity to Zero', () => {
	const response = testItemList.updateQuantity('apple seed', -1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(0);
	expect(testItemList.size()).toBe(2);
	const response2 = testItemList.updateQuantity(PlaceHolderItems.bananaSeed, -3);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.quantity).toBe(0);
	expect(testItemList.size()).toBe(1);
});

test('Should Not Update Nonexistent Item', () => {
	expect(testItemList.contains('invalid item').payload).toBe(false);
	const response = testItemList.updateQuantity('invalid item', 1);
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
});

test('Should Delete Existing Item', () => {
	const response = testItemList.deleteItem('apple seed');
	expect(response.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(2);
	const response2 = testItemList.deleteItem(PlaceHolderItems.bananaSeed);
	expect(response2.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(1);
	const response3 = testItemList.deleteItem(generateNewPlaceholderInventoryItem('coconutSeed', 1));
	expect(response3.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(0);
});

test('Should Not Delete Nonexistent Item', () => {
	expect(testItemList.contains('invalid item').payload).toBe(false);
	const response = testItemList.deleteItem('invalid item');
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
});