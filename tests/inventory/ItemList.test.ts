import { ItemList } from "@/models/inventory/ItemList";
import { generateNewPlaceholderInventoryItem, generateRandomPlaceholderInventoryItem, PlaceHolderItems } from "@/models/items/PlaceholderItems";

let testItemList: ItemList;
	

beforeEach(() => {
	const item1 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const item2 = generateNewPlaceholderInventoryItem("bananaSeed", 2);
	const item3 = generateNewPlaceholderInventoryItem("coconutSeed", 3);
	testItemList = new ItemList([item1, item2, item3]);
})

test('Should Initialize Default ItemList Object', () => {
	const inv = new ItemList();
	expect(inv).toBeTruthy();
	expect(inv.size()).toBe(0);
});

test('Should Get Existing Item', () => {
	expect(testItemList.size()).toBe(3);
	const appleSeed = testItemList.get('apple seed');
	expect(appleSeed.payload.itemData.name).toBe('apple seed');
	expect(appleSeed.isSuccessful()).toBeTruthy();
	const bananaSeed = testItemList.get(PlaceHolderItems.bananaSeed);
	expect(bananaSeed.payload.itemData.name).toBe('banana seed');
	expect(bananaSeed.isSuccessful()).toBeTruthy();
})

test('Should Not Get Nonexistent Item', () => {
	expect(testItemList.size()).toBe(3);
	const response = testItemList.get('not a real item');
	expect(response.isSuccessful()).toBeFalsy();
	expect(response.payload).toBeNull();
	const response2 = testItemList.get(PlaceHolderItems.harvestedBanana.name);
	expect(response2.isSuccessful()).toBeFalsy();
	expect(response2.payload).toBeNull();
	const response3 = testItemList.get(PlaceHolderItems.banana);
	expect(response3.isSuccessful()).toBeFalsy();
	expect(response3.payload).toBeNull();

})

test('Should Check Contains Existing Item', () => {
	expect(testItemList.size()).toBe(3);
	const appleSeed = testItemList.contains('apple seed');
	expect(appleSeed.payload).toBeTruthy();
	expect(appleSeed.isSuccessful()).toBeTruthy();
	const bananaSeed = testItemList.contains(PlaceHolderItems.bananaSeed);
	expect(bananaSeed.payload).toBeTruthy();
	expect(bananaSeed.isSuccessful()).toBeTruthy();
})

test('Should Check Does Not Contain Nonexistent Item', () => {
	expect(testItemList.size()).toBe(3);
	const response = testItemList.contains('harvested apple');
	expect(response.payload).toBeFalsy();
	expect(response.isSuccessful()).toBeTruthy();
	const response2 = testItemList.contains(PlaceHolderItems.harvestedBanana);
	expect(response2.payload).toBeFalsy();
	expect(response2.isSuccessful()).toBeTruthy();
	const response3 = testItemList.contains('not a real item');
	expect(response3.payload).toBeFalsy();
	expect(response3.isSuccessful()).toBeTruthy();
})

test('Should Add Item to List', () => {
	const inv = new ItemList();
	expect(inv).toBeTruthy();
	expect(inv.size()).toBe(0);
	inv.addItem(generateRandomPlaceholderInventoryItem());
	expect(inv).toBeTruthy();
	expect(inv.size()).toBe(1);
});

test('Should Add New Item If Not Existing', () => {
	const inv = new ItemList();
	expect(inv).toBeTruthy();
	expect(inv.size()).toBe(0);
	const response = inv.addItem(generateNewPlaceholderInventoryItem("appleSeed", 1));
	expect(response.isSuccessful()).toBeTruthy();
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(generateNewPlaceholderInventoryItem("bananaSeed", 2));
	expect(response2.isSuccessful()).toBeTruthy();
	expect(inv.size()).toBe(2);
	expect(inv.get("apple seed").payload.quantity).toBe(1);
	expect(inv.get("banana seed").payload.quantity).toBe(2);
})

test('Should Update Quantity When Adding Item', () => {
	const inv = new ItemList();
	expect(inv).toBeTruthy();
	expect(inv.size()).toBe(0);
	const response = inv.addItem(generateNewPlaceholderInventoryItem("appleSeed", 1));
	expect(response.isSuccessful()).toBeTruthy();
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(generateNewPlaceholderInventoryItem("appleSeed", 2));
	expect(response2.isSuccessful()).toBeTruthy();
	expect(inv.size()).toBe(1);
	expect(inv.get("apple seed").payload.quantity).toBe(3);
});

test('Should Update Quantity of Existing Item', () => {

})

test('Should Not Update Nonexistent Item', () => {

})

test('Should Delete Existing Item', () => {

})

test('Should Not Delete Nonexistent Item', () => {

})