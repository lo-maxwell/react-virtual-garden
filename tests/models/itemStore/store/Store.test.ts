import { PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import { Store } from "@/models/itemStore/store/Store";

let testStore: Store;
let testInventory: Inventory;

beforeEach(() => {
	const item1 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const item2 = generateNewPlaceholderInventoryItem("bananaSeed", 20);
	const item3 = generateNewPlaceholderInventoryItem("coconutSeed", 30);
	const testItemList = new ItemList([item1, item2, item3]);
	testStore = new Store(1, "Test Store", 2.0, 1.0, testItemList, new ItemList());
	const item4 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const testItemList2 = new ItemList([item4]);
	testInventory = new Inventory("Test User", 100, testItemList2);
});

test('Should Initialize Default Store Object', () => {
	const inv = new Store(1, "Dummy Store", 2.0, 1.0, new ItemList(), new ItemList());
	expect(inv).not.toBeUndefined();
	expect(inv).not.toBeNull();
	expect(inv.getStoreId()).toBe(1);
	expect(inv.getStoreName()).toBe("Dummy Store");
	expect(inv.size()).toBe(0);
	expect(inv.getBuyMultiplier()).toBe(2);
	expect(inv.getSellMultiplier()).toBe(1);
	const item = generateNewPlaceholderInventoryItem("appleSeed", 1);
	expect(inv.getBuyPrice(item)).toBe(20);
	expect(inv.getSellPrice(item)).toBe(10);
	inv.setBuyMultiplier(100);
	inv.setSellMultiplier(100);
	expect(inv.getBuyMultiplier()).toBe(100);
	expect(inv.getSellMultiplier()).toBe(100);

});

test('Should Get All Items', () => {
	const items = testStore.getAllItems();
	expect(items.length).toBe(3);
})

test('Should Find Item', () => {
	const getResponse = testStore.getItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed);
	expect(getResponse.isSuccessful()).toBe(true);
	expect(getResponse.payload.itemData.name).toBe('apple seed');
	const containsResponse = testStore.contains(PlaceholderItemTemplates.PlaceHolderItems.appleSeed);
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(true);
})

test('Should Not Find Nonexistent Item', () => {
	const getResponse = testStore.getItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple);
	expect(getResponse.isSuccessful()).toBe(false);
	const containsResponse = testStore.contains(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple);
	expect(containsResponse.isSuccessful()).toBe(true);
	expect(containsResponse.payload).toBe(false);
})

test('Should Gain Item To Store', () => {
	const response = testStore.gainItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(testStore.size()).toBe(4);
	expect(testStore.getItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple).payload.quantity).toBe(1);
	const response2 = testStore.gainItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple, 3);
	expect(response2.isSuccessful()).toBe(true);
	expect(testStore.size()).toBe(4);
	expect(testStore.getItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple).payload.quantity).toBe(4);
})

test('Should Not Gain Invalid Item', () => {
	expect(testStore.size()).toBe(3);
	const response = testStore.gainItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple, 0);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	const response2 = testStore.gainItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple, -1);
	expect(response2.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	const response3 = testStore.gainItem(PlaceholderItemTemplates.PlaceHolderItems.apple, 1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
})

test('Should Trash Item From Store', () => {
	const response = testStore.trashItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.quantity).toBe(0);
	expect(testStore.size()).toBe(2);
	const response2 = testStore.trashItem(PlaceholderItemTemplates.PlaceHolderItems.bananaSeed, 1);
	expect(response2.isSuccessful()).toBe(true);
	expect(response2.payload.quantity).toBe(19);
	expect(testStore.size()).toBe(2);
	expect(testStore.getItem(PlaceholderItemTemplates.PlaceHolderItems.bananaSeed).payload.quantity).toBe(19);
})

test('Should Not Trash Nonexistent Item From Store', () => {
	const response = testStore.trashItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple, 1);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	const response2 = testStore.trashItem(PlaceholderItemTemplates.PlaceHolderItems.bananaSeed, 0);
	expect(response2.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	const response3 = testStore.trashItem(PlaceholderItemTemplates.PlaceHolderItems.coconutSeed, -1);
	expect(response3.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
})

test('Should Buy Out Existing Item From Store', () => {
	const response = testStore.buyItemFromStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(testStore.contains('apple seed').payload).toBe(false);
	expect(testInventory.getGold()).toBe(100 - testStore.getBuyPrice(response.payload.storeItem) * 1);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(2);
	expect(response.payload.finalGold).toBe(100 - testStore.getBuyPrice(response.payload.storeItem) * 1);
	expect(response.payload.storeItem.quantity).toBe(0);
	expect(response.payload.purchasedItem.quantity).toBe(2);
})

test('Should Buy Existing Item From Store', () => {
	const response = testStore.buyItemFromStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.bananaSeed, 2);
	expect(response.isSuccessful()).toBe(true);
	expect(testStore.getItem('banana seed').payload.quantity).toBe(18);
	expect(testInventory.getGold()).toBe(100 - testStore.getBuyPrice(response.payload.storeItem) * 2);
	expect(testInventory.getItem('banana seed').payload.quantity).toBe(2);
	expect(response.payload.finalGold).toBe(100 - testStore.getBuyPrice(response.payload.storeItem) * 2);
	expect(response.payload.storeItem.quantity).toBe(18);
	expect(response.payload.purchasedItem.quantity).toBe(2);
})

test('Should Not Buy Nonexisting Item From Store', () => {
	const response = testStore.buyItemFromStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.benchBlueprint, 1);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	expect(testInventory.getGold()).toBe(100);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(1);
})

test('Should Not Buy Nonexisting Quantity From Store', () => {
	const response = testStore.buyItemFromStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, -1);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	expect(testInventory.getGold()).toBe(100);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(1);
})

test('Should Not Buy Item From Store With High Price', () => {
	testInventory.removeGold(99);
	expect(testInventory.getGold()).toBe(1);
	const response = testStore.buyItemFromStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 1);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	expect(testInventory.getGold()).toBe(1);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(1);
})

test('Should Not Buy Item From Store With High Quantity', () => {
	const response = testStore.buyItemFromStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 2);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	expect(testInventory.getGold()).toBe(100);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(1);
})

test('Should Sell Out Item To Store', () => {
	const response = testStore.sellItemToStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 1);
	expect(response.isSuccessful()).toBe(true);
	expect(testInventory.contains('apple seed').payload).toBe(false);
	expect(testInventory.getGold()).toBe(100 + testStore.getSellPrice(response.payload.storeItem) * 1);
	expect(testStore.getItem('apple seed').payload.quantity).toBe(2);
	expect(response.payload.finalGold).toBe(100 + testStore.getSellPrice(response.payload.storeItem) * 1);
	expect(response.payload.storeItem.quantity).toBe(2);
	expect(response.payload.soldItem.quantity).toBe(0);
})

test('Should Sell Existing Item To Store', () => {
	testInventory.gainItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 100);
	const response = testStore.sellItemToStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 10);
	expect(response.isSuccessful()).toBe(true);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(91);
	expect(testInventory.getGold()).toBe(100 + testStore.getSellPrice(response.payload.storeItem) * 10);
	expect(testStore.getItem('apple seed').payload.quantity).toBe(11);
	expect(response.payload.finalGold).toBe(100 + testStore.getSellPrice(response.payload.storeItem) * 10);
	expect(response.payload.storeItem.quantity).toBe(11);
	expect(response.payload.soldItem.quantity).toBe(91);
})


test('Should Not Sell Nonexisting Item To Store', () => {
	const response = testStore.sellItemToStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.bananaSeed, 1);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	expect(testInventory.getGold()).toBe(100);
	expect(testInventory.getItem('banana seed').isSuccessful()).toBe(false);
})

test('Should Not Sell Nonexisting Quantity To Store', () => {
	const response = testStore.sellItemToStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, -1);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	expect(testInventory.getGold()).toBe(100);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(1);
})

test('Should Not Sell Item To Store With High Quantity', () => {
	const response = testStore.sellItemToStore(testInventory, PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 100);
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.size()).toBe(3);
	expect(testInventory.getGold()).toBe(100);
	expect(testInventory.getItem('apple seed').payload.quantity).toBe(1);
})

test('Should Delete All', () => {
	const response = testStore.emptyStore();
	expect(response.isSuccessful()).toBe(true);
	expect(testStore.size()).toBe(0);
	expect(testStore.contains('apple seed').payload).toBe(false);
})

test('Should Restock Store With Default', () => {
	testStore.setStockList(new ItemList([generateNewPlaceholderInventoryItem('appleSeed', 100), generateNewPlaceholderInventoryItem('bananaSeed', 99)]));
	const response = testStore.restockStore();
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload).toBe(true);
	expect(testStore.getItem('apple seed').payload.getQuantity()).toBe(100);
	expect(testStore.getItem('banana seed').payload.getQuantity()).toBe(99);
})

test('Should Restock Store With Explicit StockList', () => {
	testStore.setStockList(new ItemList([generateNewPlaceholderInventoryItem('appleSeed', 1), generateNewPlaceholderInventoryItem('bananaSeed', 1)]));
	const response = testStore.restockStore(new ItemList([generateNewPlaceholderInventoryItem('appleSeed', 100), generateNewPlaceholderInventoryItem('bananaSeed', 99)]));
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload).toBe(true);
	expect(testStore.getItem('apple seed').payload.getQuantity()).toBe(100);
	expect(testStore.getItem('banana seed').payload.getQuantity()).toBe(99);
})

test('Should Not Restock Lower Quantity', () => {
	testStore.gainItem(generateNewPlaceholderInventoryItem('appleSeed', 100), 100);
	testStore.setStockList(new ItemList([generateNewPlaceholderInventoryItem('appleSeed', 1), generateNewPlaceholderInventoryItem('bananaSeed', 1)]));
	const response = testStore.restockStore();
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload).toBe(true);
	expect(testStore.getItem('apple seed').payload.getQuantity()).toBe(101);
	expect(testStore.getItem('banana seed').payload.getQuantity()).toBe(20);
})

test('Should Rollback on Failing Restock', () => {
	testStore.setStockList(new ItemList([generateNewPlaceholderInventoryItem('appleSeed', -1), generateNewPlaceholderInventoryItem('harvestedApple', -1)]));
	console.log(testStore.getAllItems());
	const response = testStore.restockStore();
	expect(response.isSuccessful()).toBe(false);
	expect(testStore.getItem('apple seed').payload.getQuantity()).toBe(1);
	expect(testStore.getItem('banana seed').payload.getQuantity()).toBe(20);
	expect(testStore.contains('harvested apple').payload).toBe(false);
})