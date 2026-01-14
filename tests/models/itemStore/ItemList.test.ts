import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { generateInventoryEgg, generateInventoryItem, generateRandomInventoryItem } from "@/models/items/ItemFactory";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { InventoryEggTemplate } from "@/models/items/templates/models/InventoryItemTemplates/InventoryEggTemplate";
import { InventoryEgg } from "@/models/items/inventoryItems/InventoryEgg";
import { generateDefaultEggDetails } from "@/models/items/EggDetails";

let testItemList: InventoryItemList;

beforeEach(() => {
	const item1 = generateInventoryItem("apple seed", 1);
	const item2 = generateInventoryItem("banana seed", 2);
	const item3 = generateInventoryItem("coconut seed", 3);
	testItemList = new InventoryItemList([item1, item2, item3]);
});

// ------------------------------
// Basic Initialization & Retrieval
// ------------------------------
test('Should Initialize Default ItemList Object', () => {
	const inv = new InventoryItemList();
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.size()).toBe(0);
});

test('Should Get All Items', () => {
	const items = testItemList.getAllItems();
	expect(items.length).toBe(3);
});

// ------------------------------
// Get by subtype & category
// ------------------------------
test('Should Get Items By Subtype', () => {
	testItemList.addItem(generateInventoryItem('apple', 1), 1);
	let items = testItemList.getItemsBySubtype(ItemSubtypes.SEED.name);
	expect(items.length).toBe(3);
	items = testItemList.getItemsBySubtype(ItemSubtypes.HARVESTED.name);
	expect(items.length).toBe(1);
	items = testItemList.getItemsBySubtype(ItemSubtypes.BLUEPRINT.name);
	expect(items.length).toBe(0);
});

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
});

// ------------------------------
// Item existence & quantity checks
// ------------------------------
test('Should Get Existing Item', () => {
	const appleSeed = testItemList.getItem('apple seed');
	expect(appleSeed.payload!.itemData.name).toBe('apple seed');
	expect(appleSeed.isSuccessful()).toBe(true);
});

test('Should Not Get Nonexistent Item', () => {
	const response = testItemList.getItem('not a real item');
	expect(response.isSuccessful()).toBe(false);
	expect(response.payload).toBeNull();
});

// ------------------------------
// Add & Update items
// ------------------------------
test('Should Add New Item If Not Existing', () => {
	const inv = new InventoryItemList();
	const response = inv.addItem(generateInventoryItem("apple seed", 1), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(1);
	const response2 = inv.addItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 2);
	expect(response2.isSuccessful()).toBe(true);
	expect(inv.size()).toBe(2);
	expect(inv.getItem("apple seed").payload!.getQuantity()).toBe(1);
	expect(inv.getItem("banana seed").payload!.getQuantity()).toBe(2);
});

test('Should Update Quantity of Existing Item', () => {
	const response = testItemList.updateQuantity('apple seed', 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload!.getQuantity()).toBe(2);
});

// ------------------------------
// Delete items
// ------------------------------
test('Should Delete Existing Item', () => {
	const response = testItemList.deleteItem('apple seed');
	expect(response.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(2);
});

// ------------------------------
// Use interactions
// ------------------------------

// Stackable seeds
test('Should Use AppleSeed Item', () => {
	const response = testItemList.useItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload!.originalItem.getQuantity()).toBe(0);
	expect(response.payload!.newTemplate.name).toBe('apple');
	expect(testItemList.getItem('apple seed').payload!.getQuantity()).toBe(0);
});

// Unique egg
test('Should Use InventoryEgg Item', () => {
	const egg = generateInventoryEgg('goose egg');
	testItemList.addItem(egg, 1);

	const response = testItemList.useItem('goose egg', 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload!.originalItem.getQuantity()).toBe(0);
	expect(response.payload!.newTemplate.id).toBe('0-06-01-01-00');
	expect(testItemList.contains('goose egg').payload).toBe(false);
});

// Cannot use if quantity insufficient
test('Should Not Use Item Lacking Quantity', () => {
	const response = testItemList.useItem(itemTemplateFactory.getInventoryItemTemplateByName('coconut seed')!, 5);
	expect(response.isSuccessful()).toBe(false);
});

// ------------------------------
// Delete all items
// ------------------------------
test('Should Delete All', () => {
	const response = testItemList.deleteAll();
	expect(response.isSuccessful()).toBe(true);
	expect(testItemList.size()).toBe(0);
	expect(testItemList.contains('apple seed').payload).toBe(false);
});

// ------------------------------
// Serialization
// ------------------------------
test('Should Create ItemList Object From PlainObject', () => {
	const serializedItemList = JSON.stringify((new InventoryItemList([generateInventoryItem('apple seed', 10)])).toPlainObject());
	const inv = InventoryItemList.fromPlainObject(JSON.parse(serializedItemList));
	expect(inv.size()).toBe(1);
	expect(inv.contains('apple seed').payload).toBe(true);
});
