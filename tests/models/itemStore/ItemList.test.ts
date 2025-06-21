import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { generateInventoryItem, generateRandomInventoryItem } from "@/models/items/ItemFactory";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { ItemSubtypes } from "@/models/items/ItemTypes";

let testItemList: InventoryItemList;
	

beforeEach(() => {
	const item1 = generateInventoryItem("apple seed", 1);
	const item2 = generateInventoryItem("banana seed", 2);
	const item3 = generateInventoryItem("coconut seed", 3);
	testItemList = new InventoryItemList([item1, item2, item3]);
});

test('Should Initialize Default ItemList Object', () => {
	const inv = new InventoryItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
});

test('Should Get All Items', () => {
	const items = testItemList.getAllItems();
	expect(items.length).toBe(3);
})


test('Should Get Items By Subtype', () => {
	testItemList.addItem(generateInventoryItem('apple', 1), 1);
	let items = testItemList.getItemsBySubtype(ItemSubtypes.SEED.name);
	expect(items.length).toBe(3);
	items = testItemList.getItemsBySubtype(ItemSubtypes.HARVESTED.name);
	expect(items.length).toBe(1);
	items = testItemList.getItemsBySubtype(ItemSubtypes.BLUEPRINT.name);
	expect(items.length).toBe(0);
})

test('Should Get Items By Subtype and Category', () => {
	testItemList.addItem(generateInventoryItem('apple', 1), 1);
	let items = testItemList.getItemsBySubtype(ItemSubtypes.SEED.name, "Tree Fruit");
	expect(items.length).toBe(1);
	items = testItemList.getItemsBySubtype(ItemSubtypes.SEED.name, "Onion");
	expect(items.length).toBe(0);
	items = testItemList.getItemsBySubtype(ItemSubtypes.HARVESTED.name, "Tree Fruit");
	expect(items.length).toBe(1);
	items = testItemList.getItemsBySubtype(ItemSubtypes.BLUEPRINT.name);
	expect(items.length).toBe(0);
})

test('Should Get Existing Item', () => {
	const appleSeed = testItemList.getItem('apple seed');
	expect(appleSeed.payload.itemData.name).toBe('apple seed');
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.getItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!);
	expect(bananaSeed.payload.itemData.name).toBe('banana seed');
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.getItem(generateInventoryItem("coconut seed", 1));
	expect(coconutSeed.payload.itemData.name).toBe('coconut seed');
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Not Get Nonexistent Item', () => {
	const response = testItemList.getItem('not a real item');
	expect(response.isSuccessful()).toBe(false);
	expect(response.payload).toBeNull();
	const response2 = testItemList.getItem(itemTemplateFactory.getInventoryItemTemplateByName('banana')!);
	expect(response2.isSuccessful()).toBe(false);
	expect(response2.payload).toBeNull();
	const response3 = testItemList.getItem(itemTemplateFactory.getPlacedItemTemplateByName('banana')!);
	expect(response3.isSuccessful()).toBe(false);
	expect(response3.payload).toBeNull();
});

test('Should Check Contains Existing Item', () => {
	const appleSeed = testItemList.contains('apple seed');
	expect(appleSeed.payload).toBe(true);
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.contains(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!);
	expect(bananaSeed.payload).toBe(true);
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.contains(generateInventoryItem("coconut seed", 1));
	expect(coconutSeed.payload).toBe(true);
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Check Does Not Contain Nonexistent Item', () => {
	const response = testItemList.contains('apple');
	expect(response.payload).toBe(false);
	expect(response.isSuccessful()).toBe(true);
	const response2 = testItemList.contains(itemTemplateFactory.getInventoryItemTemplateByName('banana')!);
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
	const bananaSeed = testItemList.containsAmount(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 2);
	expect(bananaSeed.payload).toBe(true);
	expect(bananaSeed.isSuccessful()).toBe(true);
	const coconutSeed = testItemList.containsAmount(generateInventoryItem("coconut seed", 1), 1);
	expect(coconutSeed.payload).toBe(true);
	expect(coconutSeed.isSuccessful()).toBe(true);
});

test('Should Check Does Not Contain Amount of Lacking Item', () => {
	const appleSeed = testItemList.containsAmount('apple seed', 2);
	expect(appleSeed.payload).toBe(false);
	expect(appleSeed.isSuccessful()).toBe(true);
	const bananaSeed = testItemList.containsAmount(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 0);
	expect(bananaSeed.isSuccessful()).toBe(false);
	const coconutSeed = testItemList.containsAmount(generateInventoryItem("coconut seed", 1), -1);
	expect(coconutSeed.isSuccessful()).toBe(false);
});

test('Should Check Does Not Contain Amount of Nonexistent Item', () => {
	const response = testItemList.containsAmount('apple', 1);
	expect(response.payload).toBe(false);
	expect(response.isSuccessful()).toBe(true);
	const response2 = testItemList.containsAmount(itemTemplateFactory.getInventoryItemTemplateByName('banana')!, 2);
	expect(response2.payload).toBe(false);
	expect(response2.isSuccessful()).toBe(true);
	const response3 = testItemList.containsAmount('not a real item', 3);
	expect(response3.payload).toBe(false);
	expect(response3.isSuccessful()).toBe(true);
});

test('Should Add Item to List', () => {
	const inv = new InventoryItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
	const randItem = generateRandomInventoryItem();
	inv.addItem(randItem, 1);
	expect(inv.size()).toBe(1);
});

test('Should Add New Item If Not Existing', () => {
	const inv = new InventoryItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	const response = inv.addItem(generateInventoryItem("apple seed", 1), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(2);
	expect(inv.getItem("apple seed").payload.quantity).toBe(1);
	expect(inv.getItem("banana seed").payload.quantity).toBe(2);
});

test('Should Not Add Invalid Item', () => {
	const response = testItemList.addItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response2 = testItemList.addItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
	const response3 = testItemList.addItem(itemTemplateFactory.getPlacedItemTemplateByName('apple')!, 1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(3);
})

test('Should Update Quantity When Adding Item', () => {
	const inv = new InventoryItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
	const response = inv.addItem(generateInventoryItem("apple seed", 1), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	expect(inv.getItem("apple seed").payload.quantity).toBe(3);
});

test('Should Not Add Invalid Quantity', () => {
	const response = testItemList.addItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testItemList.getItem('apple seed').payload.quantity).toBe(1);
	const response2 = testItemList.addItem(generateInventoryItem("banana seed", 1), -2);
	expect(response2.isSuccessful()).toBe(false);
	expect(testItemList.getItem('banana seed').payload.quantity).toBe(2);
	const response3 = testItemList.addItem(generateInventoryItem("apple", 1), 0);
	expect(response3.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(4);
	const response4 = testItemList.addItem(generateInventoryItem("banana", 1), -1);
	expect(response4.isSuccessful()).toBe(false);
	expect(testItemList.size()).toBe(4);
});

test('Should Update Quantity of Existing Item', () => {
	const response = testItemList.updateQuantity('apple seed', 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(2);
	const response2 = testItemList.updateQuantity(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.quantity).toBe(4);
	const response3 = testItemList.updateQuantity(generateInventoryItem('coconut seed', 1), -1);
	expect(response3.isSuccessful()).toBe(true);
	expect(response3.payload.quantity).toBe(2);
});

// test('Should Delete When Updating Quantity to Zero', () => {
// 	const response = testItemList.updateQuantity('apple seed', -1);
// 	expect(response.isSuccessful()).toBe(true);
// 	expect(response.payload.quantity).toBe(0);
// 	expect(testItemList.size()).toBe(2);
// 	const response2 = testItemList.updateQuantity(placeholderItemTemplates.getInventoryItemTemplateByName('banana seed')!, -3);
// 	expect(response2.isSuccessful()).toBe(true);
// 	expect(response2.payload.quantity).toBe(0);
// 	expect(testItemList.size()).toBe(1);
// });

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
	const response2 = testItemList.deleteItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!);
	expect(response2.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(1);
	const response3 = testItemList.deleteItem(generateInventoryItem('coconut seed', 1));
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
	const response = testItemList.useItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 1);
	expect(response.payload.originalItem.quantity).toBe(0);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('apple');
	expect(testItemList.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!).payload.quantity).toBe(0);
})

test('Should Use BananaSeed Item', () => {
	const response = testItemList.useItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 1);
	expect(response.payload.originalItem.quantity).toBe(1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('banana');
	expect(testItemList.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!).payload.quantity).toBe(1);
})

test('Should Not Use Item Lacking Quantity', () => {
	const response = testItemList.useItem(itemTemplateFactory.getInventoryItemTemplateByName('coconut seed')!, 5);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Delete All', () => {
	const response = testItemList.deleteAll();
	expect(response.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(0);
	expect(testItemList.contains('apple seed').payload).toBe(false);
})

test('Should Create ItemList Object From PlainObject', () => {
	const serializedItemList = JSON.stringify((new InventoryItemList([generateInventoryItem('apple seed', 10)])).toPlainObject());
	const inv = InventoryItemList.fromPlainObject(JSON.parse(serializedItemList));
	expect(inv.size()).toBe(1);
	expect(inv.contains('apple seed').payload).toBe(true);
})