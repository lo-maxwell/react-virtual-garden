import { Garden } from "@/models/garden/Garden";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { ItemList } from "@/models/itemStore/ItemList";
import { GardenUpgrades } from "@/models/itemStore/store/GardenUpgrades";
import { Store } from "@/models/itemStore/store/Store";
import LevelSystem from "@/models/level/LevelSystem";

let testStore: Store;
let testInventory: Inventory;
let testGarden: Garden;

beforeEach(() => {
	const item1 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const item2 = generateNewPlaceholderInventoryItem("bananaSeed", 20);
	const item3 = generateNewPlaceholderInventoryItem("coconutSeed", 30);
	const testItemList = new ItemList([item1, item2, item3]);
	testStore = new Store(1, "Test Store", 2.0, 1.0, 1, testItemList, new ItemList());
	const item4 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const testItemList2 = new ItemList([item4]);
	testInventory = new Inventory("Test User", 1000, testItemList2);
	testGarden = new Garden("Test User", 6, 6, Garden.generateEmptyPlots(6, 6), new LevelSystem(100));
});

test('Should Get Row Expansion Cost', () => {
	let cost = GardenUpgrades.getRowExpansionCost(testGarden, testStore);
	expect(cost).toBe(5775);
	testGarden.addRow();
	cost = GardenUpgrades.getRowExpansionCost(testGarden, testStore);
	expect(cost).toBe(6675);
	testGarden.addColumn();
	cost = GardenUpgrades.getRowExpansionCost(testGarden, testStore);
	expect(cost).toBe(9100);

})

test('Should Get Column Expansion Cost', () => {
	let cost = GardenUpgrades.getColExpansionCost(testGarden, testStore);
	expect(cost).toBe(5775);
	testGarden.addRow();
	cost = GardenUpgrades.getColExpansionCost(testGarden, testStore);
	expect(cost).toBe(7875);
	testGarden.addColumn();
	cost = GardenUpgrades.getColExpansionCost(testGarden, testStore);
	expect(cost).toBe(9100);
})

test('Should Expand Row', () => {
	testInventory.addGold(10000000);
	let response = GardenUpgrades.expandRow(testGarden, testStore, testInventory);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(7);
	expect(testGarden.getCols()).toBe(6);
	response = GardenUpgrades.expandRow(testGarden, testStore, testInventory);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(8);
	expect(testGarden.getCols()).toBe(6);
})

test('Should Not Expand Row Insufficient Gold', () => {
	let response = GardenUpgrades.expandRow(testGarden, testStore, testInventory);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(1000);
})

test('Should Expand Column', () => {
	testInventory.addGold(10000000);
	let response = GardenUpgrades.expandColumn(testGarden, testStore, testInventory);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(6);
	expect(testGarden.getCols()).toBe(7);
	response = GardenUpgrades.expandColumn(testGarden, testStore, testInventory);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(6);
	expect(testGarden.getCols()).toBe(8);
})

test('Should Not Expand Column Insufficient Gold', () => {
	let response = GardenUpgrades.expandColumn(testGarden, testStore, testInventory);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(1000);
})