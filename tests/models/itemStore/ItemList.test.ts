import { ItemList } from "@/models/itemStore/ItemList";
import { generateNewPlaceholderInventoryItem, generateRandomPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";

let testItemList: ItemList;
	

beforeEach(() => {
	const item1 = generateNewPlaceholderInventoryItem("apple seed", 1);
	const item2 = generateNewPlaceholderInventoryItem("banana seed", 2);
	const item3 = generateNewPlaceholderInventoryItem("coconut seed", 3);
	testItemList = new ItemList([item1, item2, item3]);
});

test('Should Initialize Default ItemList Object', () => {
	const inv = new ItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
});

test('Should Get All Items', () => {
	const items = testItemList.getAllItems();
	expect(items.length).toBe(3);
})

test('Should Get Existing Item', () => {
	const appleSeed = testItemList.getItem('apple seed');
	expect(appleSeed.payload.itemData.name).toBe('apple seed');
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.getItem(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!);
	expect(bananaSeed.payload.itemData.name).toBe('banana seed');
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.getItem(generateNewPlaceholderInventoryItem("coconut seed", 1));
	expect(coconutSeed.payload.itemData.name).toBe('coconut seed');
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Not Get Nonexistent Item', () => {
	const response = testItemList.getItem('not a real item');
	expect(response.isSuccessful()).toBe(false);
	expect(response.payload).toBeNull();
	const response2 = testItemList.getItem(placeholderItemTemplates.getInventoryItemTemplateByName('banana')!);
	expect(response2.isSuccessful()).toBe(false);
	expect(response2.payload).toBeNull();
	const response3 = testItemList.getItem(placeholderItemTemplates.getPlacedItemTemplateByName('banana')!);
	expect(response3.isSuccessful()).toBe(false);
	expect(response3.payload).toBeNull();
});

test('Should Check Contains Existing Item', () => {
	const appleSeed = testItemList.contains('apple seed');
	expect(appleSeed.payload).toBe(true);
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.contains(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!);
	expect(bananaSeed.payload).toBe(true);
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.contains(generateNewPlaceholderInventoryItem("coconut seed", 1));
	expect(coconutSeed.payload).toBe(true);
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Check Does Not Contain Nonexistent Item', () => {
	const response = testItemList.contains('apple');
	expect(response.payload).toBe(false);
	expect(response.isSuccessful()).toBe(true);
	const response2 = testItemList.contains(placeholderItemTemplates.getInventoryItemTemplateByName('banana')!);
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
	const bananaSeed = testItemList.containsAmount(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!, 2);
	expect(bananaSeed.payload).toBe(true);
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.containsAmount(generateNewPlaceholderInventoryItem("coconut seed", 1), 1);
	expect(coconutSeed.payload).toBe(true);
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Check Does Not Contain Amount of Lacking Item', () => {
	const appleSeed = testItemList.containsAmount('apple seed', 2);
	expect(appleSeed.payload).toBe(false);
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.containsAmount(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!, 0);
	expect(bananaSeed.isSuccessful()).toBe(false);
	const coconutSeed = testItemList.containsAmount(generateNewPlaceholderInventoryItem("coconut seed", 1), -1);
	expect(coconutSeed.isSuccessful()).toBe(false);
});

test('Should Check Does Not Contain Amount of Nonexistent Item', () => {
	const response = testItemList.containsAmount('apple', 1);
	expect(response.payload).toBe(false);
	expect(response.isSuccessful()).toBe(true);
	const response2 = testItemList.containsAmount(placeholderItemTemplates.getInventoryItemTemplateByName('banana')!, 2);
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
	const response = inv.addItem(generateNewPlaceholderInventoryItem("apple seed", 1), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(2);
	expect(inv.getItem("apple seed").payload.quantity).toBe(1);
	expect(inv.getItem("banana seed").payload.quantity).toBe(2);
});

test('Should Not Add Invalid Item', () => {
	const response = testItemList.addItem(placeholderItemTemplates.getInventoryItemTemplateByName('apple seed')!, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response2 = testItemList.addItem(placeholderItemTemplates.getInventoryItemTemplateByName('apple')!, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response3 = testItemList.addItem(placeholderItemTemplates.getPlacedItemTemplateByName('apple')!, 1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
})

test('Should Update Quantity When Adding Item', () => {
	const inv = new ItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
	const response = inv.addItem(generateNewPlaceholderInventoryItem("apple seed", 1), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(placeholderItemTemplates.getInventoryItemTemplateByName('apple seed')!, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	expect(inv.getItem("apple seed").payload.quantity).toBe(3);
});

test('Should Not Add Invalid Quantity', () => {
	const response = testItemList.addItem(placeholderItemTemplates.getInventoryItemTemplateByName('apple seed')!, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.getItem('apple seed').payload.quantity).toBe(1);
	const response2 = testItemList.addItem(generateNewPlaceholderInventoryItem("banana seed", 1), -2);
	expect(response2.isSuccessful()).toBe(false);
	expect(testItemList.getItem('banana seed').payload.quantity).toBe(2);
	const response3 = testItemList.addItem(generateNewPlaceholderInventoryItem("apple", 1), 0);
	expect(response3.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response4 = testItemList.addItem(generateNewPlaceholderInventoryItem("banana", 1), -1);
	expect(response4.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
});

test('Should Update Quantity of Existing Item', () => {
	const response = testItemList.updateQuantity('apple seed', 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(2);
	const response2 = testItemList.updateQuantity(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.quantity).toBe(4);
	const response3 = testItemList.updateQuantity(generateNewPlaceholderInventoryItem('coconut seed', 1), -1);
	expect(response3.isSuccessful()).toBe(true);
	expect(response3.payload.quantity).toBe(2);
});

test('Should Delete When Updating Quantity to Zero', () => {
	const response = testItemList.updateQuantity('apple seed', -1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(0);
	expect(testItemList.size()).toBe(2);
	const response2 = testItemList.updateQuantity(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!, -3);
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
	const response2 = testItemList.deleteItem(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!);
	expect(response2.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(1);
	const response3 = testItemList.deleteItem(generateNewPlaceholderInventoryItem('coconut seed', 1));
	expect(response3.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(0);
});

test('Should Not Delete Nonexistent Item', () => {
	expect(testItemList.contains('invalid item').payload).toBe(false);
	const response = testItemList.deleteItem('invalid item');
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
});

test('Should Use AppleSeed Item', () => {
	const response = testItemList.useItem(placeholderItemTemplates.getInventoryItemTemplateByName('apple seed')!, 1);
	expect(response.payload.originalItem.quantity).toBe(0);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('apple');
	expect(testItemList.getItem(placeholderItemTemplates.getInventoryItemTemplateByName('apple seed')!).payload.quantity).toBe(0);
})

test('Should Use BananaSeed Item', () => {
	const response = testItemList.useItem(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!, 1);
	expect(response.payload.originalItem.quantity).toBe(1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('banana');
	expect(testItemList.getItem(placeholderItemTemplates.getInventoryItemTemplateByName('apple seed')!).payload.quantity).toBe(1);
})

test('Should Not Use Item Lacking Quantity', () => {
	const response = testItemList.useItem(placeholderItemTemplates.getInventoryItemTemplateByName('coconut seed')!, 5);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Delete All', () => {
	const response = testItemList.deleteAll();
	expect(response.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(0);
	expect(testItemList.contains('apple seed').payload).toBe(false);
})

test('Should Create ItemList Object From PlainObject', () => {
	const serializedItemList = JSON.stringify((new ItemList([generateNewPlaceholderInventoryItem('apple seed', 10)])).toPlainObject());
	const inv = ItemList.fromPlainObject(JSON.parse(serializedItemList));
	expect(inv.size()).toBe(1);
	expect(inv.contains('apple seed').payload).toBe(true);
})