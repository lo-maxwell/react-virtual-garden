import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { generateInventoryItem} from "@/models/items/ItemFactory";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { v4 as uuidv4 } from 'uuid';
import User from "@/models/user/User";


let testInventory: Inventory;

beforeEach(() => {
	const item1 = generateInventoryItem("apple seed", 1);
	const item2 = generateInventoryItem("banana seed", 2);
	const item3 = generateInventoryItem("coconut seed", 3);
	const testItemList = new InventoryItemList([item1, item2, item3]);
	testInventory = new Inventory(uuidv4(), User.getDefaultUserName(), 100, testItemList);
});

test('Should Initialize Default Inventory Object', () => {
	const inv = new Inventory(uuidv4(), "Dummy User", 100, new InventoryItemList());
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.getGold()).toBe(100);
	expect(inv.getOwnerName()).toBe("Dummy User");
	expect(inv.size()).toBe(0);
});

test('Should Get All Items', () => {
	const items = testInventory.getAllItems();
	expect(items.length).toBe(3);
})


test('Should Get Items By Subtype', () => {
	testInventory.gainItem(generateInventoryItem('apple', 1), 1);
	let items = testInventory.getItemsBySubtype(ItemSubtypes.SEED.name);
	expect(items.length).toBe(3);
	items = testInventory.getItemsBySubtype(ItemSubtypes.HARVESTED.name);
	expect(items.length).toBe(1);
	items = testInventory.getItemsBySubtype(ItemSubtypes.BLUEPRINT.name);
	expect(items.length).toBe(0);
})

test('Should Get Items By Subtype and Category', () => {
	testInventory.gainItem(generateInventoryItem('apple', 1), 1);
	let items = testInventory.getItemsBySubtype(ItemSubtypes.SEED.name, "Tree Fruit");
	expect(items.length).toBe(1);
	items = testInventory.getItemsBySubtype(ItemSubtypes.SEED.name, "Onion");
	expect(items.length).toBe(0);
	items = testInventory.getItemsBySubtype(ItemSubtypes.HARVESTED.name, "Tree Fruit");
	expect(items.length).toBe(1);
	items = testInventory.getItemsBySubtype(ItemSubtypes.BLUEPRINT.name);
	expect(items.length).toBe(0);
})

test('Should Find Item', () => {
	const getResponse = testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!);
	expect(getResponse.isSuccessful()).toBe(true);
	expect(getResponse.payload.itemData.name).toBe('apple seed');
	const containsResponse = testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!);
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(true);
})

test('Should Not Find Nonexistent Item', () => {
	const getResponse = testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!);
	expect(getResponse.isSuccessful()).toBe(false);
	const containsResponse = testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('apple')!);
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(false);
})

test('Should Gain Item To Inventory', () => {
	const response = testInventory.gainItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!).payload.quantity).toBe(1);
	const response2 = testInventory.gainItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 3);
	expect(response2.isSuccessful()).toBe(true);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!).payload.quantity).toBe(4);
})

test('Should Not Gain Invalid Item', () => {
	expect(testInventory.size()).toBe(3);
	const response = testInventory.gainItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(4); //Error message, but we do add to the size of the list
	const response2 = testInventory.gainItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(4);
	const response3 = testInventory.gainItem(itemTemplateFactory.getPlacedItemTemplateByName('planted apple')!, 1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(4);
})

test('Should Trash Item From Inventory', () => {
	const response = testInventory.trashItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(0);
	//Does not delete the item from the inventory
	expect(testInventory.size()).toBe(3);
	const response2 = testInventory.trashItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.quantity).toBe(1);
	expect(testInventory.size()).toBe(3);
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!).payload.quantity).toBe(1);
})

test('Should Not Trash Nonexistent Item From Inventory', () => {
	const response = testInventory.trashItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 1);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	const response2 = testInventory.trashItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 0);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	const response3 = testInventory.trashItem(itemTemplateFactory.getInventoryItemTemplateByName('coconut seed')!, -1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
})

//TODO: Verify payload is correct for buy/sell
test('Should Buy Item', () => {
	const response = testInventory.buyItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 1, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.finalGold).toBe(100 - (itemTemplateFactory.getInventoryItemTemplateByName('apple')?.getPrice(1) || 999));
	expect(response.payload.purchasedItem.quantity).toBe(1);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('apple')!).payload).toBe(true);
	const response2 = testInventory.buyItem(generateInventoryItem("apple", 1), 1, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.finalGold).toBe(100 - 2 * (itemTemplateFactory.getInventoryItemTemplateByName('apple')?.getPrice(1) || 999));
	expect(response.payload.purchasedItem.quantity).toBe(2);
	expect(testInventory.size()).toBe(4);
	expect(testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('apple')!).payload).toBe(true);
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!).payload.quantity).toBe(2);
	expect(testInventory.getGold()).toBe(100 - 2 * (itemTemplateFactory.getInventoryItemTemplateByName('apple')?.getPrice(1) || 999));
})

test('Should Not Buy Expensive Item', () => {
	const response = testInventory.buyItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 1, 10);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.size()).toBe(3);
	expect(testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('apple')!).payload).toBe(false);
	expect(testInventory.getGold()).toBe(100);
})

test('Should Not Buy Invalid Item', () => {
	const response = testInventory.buyItem(itemTemplateFactory.getPlacedItemTemplateByName('apple')!, 1, 1);
	expect(response.isSuccessful()).toBe(false);
	const response2 = testInventory.buyItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 1, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(100);
})

test('Should Sell Item', () => {
	const response = testInventory.sellItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 1, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.finalGold).toBe(100 + (itemTemplateFactory.getInventoryItemTemplateByName('apple seed')?.getPrice(1) || 999));
	expect(response.payload.remainingItem.quantity).toBe(0);
	//Does not delete the item from the inventory
	expect(testInventory.size()).toBe(3);
	expect(testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!).payload).toBe(false);
	const response2 = testInventory.sellItem(generateInventoryItem("banana seed", 1), 2, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.finalGold).toBe(100 + (itemTemplateFactory.getInventoryItemTemplateByName('apple seed')?.getPrice(1) || 999) + 2 * generateInventoryItem("banana seed", 1).itemData.getPrice(1));
	expect(response2.payload.remainingItem.quantity).toBe(1);
	expect(testInventory.size()).toBe(3);
	expect(testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!).payload).toBe(true);
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!).payload.quantity).toBe(1);
	const response3 = testInventory.sellItem(itemTemplateFactory.getInventoryItemTemplateByName('coconut seed')!, 0.5, 2);
	expect(response3.isSuccessful()).toBe(true);
	expect(response3.payload.finalGold).toBe(100 + (itemTemplateFactory.getInventoryItemTemplateByName('apple seed')?.getPrice(1) || 999) + 2 * generateInventoryItem("banana seed", 1).itemData.getPrice(1) + 2 * generateInventoryItem("coconut seed", 1).itemData.getPrice(0.5));
	expect(response3.payload.remainingItem.quantity).toBe(1);
	expect(testInventory.size()).toBe(3);
	expect(testInventory.contains(itemTemplateFactory.getInventoryItemTemplateByName('coconut seed')!).payload).toBe(true);
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('coconut seed')!).payload.quantity).toBe(1);
	expect(testInventory.getGold()).toBe(100 + (itemTemplateFactory.getInventoryItemTemplateByName('apple seed')?.getPrice(1) || 999) + 2 * generateInventoryItem("banana seed", 1).itemData.getPrice(1) + 2 * generateInventoryItem("coconut seed", 1).itemData.getPrice(0.5));
})

test('Should Not Sell Nonexistent Item', () => {
	const response = testInventory.sellItem(itemTemplateFactory.getInventoryItemTemplateByName('apple')!, 1, 1);
	expect(response.isSuccessful()).toBe(false);
	const response2 = testInventory.sellItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 1, 2);
	expect(response2.isSuccessful()).toBe(false);
	const response3 = testInventory.sellItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 1, -1);
	expect(response3.isSuccessful()).toBe(false);
	const response4 = testInventory.sellItem(itemTemplateFactory.getPlacedItemTemplateByName('apple')!, 1, 1);
	expect(response4.isSuccessful()).toBe(false);
	const response5 = testInventory.sellItem('not an item', 1, 1);
	expect(response5.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(100);
})

test('Should Add Gold', () => {
	const response = testInventory.addGold(100);
	expect(response.isSuccessful()).toBe(true);
	expect(testInventory.getGold()).toBe(200);
})

test('Should Not Add Invalid Gold Amount', () => {
	const response = testInventory.addGold(0.5);
	expect(response.isSuccessful()).toBe(false);
	const response2 = testInventory.addGold(-1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(100);
})

test('Should Remove Gold', () => {
	const response = testInventory.removeGold(50);
	expect(response.isSuccessful()).toBe(true);
	expect(testInventory.getGold()).toBe(50);
	const response2 = testInventory.removeGold(120);
	expect(response2.isSuccessful()).toBe(true);
	expect(testInventory.getGold()).toBe(0);
})

test('Should Not Remove Invalid Gold Amount', () => {
	const response = testInventory.removeGold(0.5);
	expect(response.isSuccessful()).toBe(false);
	const response2 = testInventory.removeGold(-1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(100);
})

test('Should Use Item Then Delete', () => {
	const response = testInventory.useItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!, 1);
	expect(response.payload.originalItem.quantity).toBe(0);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('apple');
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!).isSuccessful()).toBe(true);
})

test('Should Use Item', () => {
	const response = testInventory.useItem(itemTemplateFactory.getInventoryItemTemplateByName('banana seed')!, 1);
	expect(response.payload.originalItem.quantity).toBe(1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('banana');
	expect(testInventory.getItem(itemTemplateFactory.getInventoryItemTemplateByName('apple seed')!).payload.quantity).toBe(1);
})

test('Should Not Use Item Lacking Quantity', () => {
	const response = testInventory.useItem(itemTemplateFactory.getInventoryItemTemplateByName('coconut seed')!, 5);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Create Inventory Object From PlainObject', () => {
	const serializedInventory = JSON.stringify((new Inventory(uuidv4(), "Dummy User", 100, new InventoryItemList([generateInventoryItem('banana seed', 10)]))).toPlainObject());
	const inv = Inventory.fromPlainObject(JSON.parse(serializedInventory));
	expect(inv.getOwnerName()).toBe("Dummy User");
	expect(inv.size()).toBe(1);
	expect(inv.contains('banana seed').payload).toBe(true);
})

test('Should Add and Remove Inventory Egg', () => {
	const eggTemplate = itemTemplateFactory.getInventoryItemTemplateByName('goose egg');
	if (eggTemplate && eggTemplate.subtype === 'InventoryEgg') {
		const response = testInventory.gainItem(eggTemplate, 1);
		expect(response.isSuccessful()).toBe(true);
		expect(testInventory.size()).toBeGreaterThanOrEqual(3);
		expect(testInventory.contains('goose egg').payload).toBe(true);
		
		const getResponse = testInventory.getItem('goose egg');
		if (getResponse.isSuccessful()) {
			expect(getResponse.payload.itemData.subtype).toBe('InventoryEgg');
			expect(getResponse.payload.getQuantity()).toBeGreaterThanOrEqual(1);
			
			const trashResponse = testInventory.trashItem(eggTemplate, 1);
			expect(trashResponse.isSuccessful()).toBe(true);
		}
	}
})

test('Should Get Items By Subtype Including Eggs', () => {
	const eggTemplate = itemTemplateFactory.getInventoryItemTemplateByName('goose egg');
	if (eggTemplate && eggTemplate.subtype === 'InventoryEgg') {
		testInventory.gainItem(eggTemplate, 2);
		const items = testInventory.getItemsBySubtype(ItemSubtypes.INVENTORY_EGG.name);
		expect(items.length).toBeGreaterThanOrEqual(1);
		expect(items.some(item => item.itemData.subtype === 'InventoryEgg')).toBe(true);
	}
})