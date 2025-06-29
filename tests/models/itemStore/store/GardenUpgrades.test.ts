import { Garden } from "@/models/garden/Garden";
import { generateInventoryItem } from "@/models/items/ItemFactory";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { GardenUpgrades } from "@/models/itemStore/store/GardenUpgrades";
import { Store } from "@/models/itemStore/store/Store";
import LevelSystem from "@/models/level/LevelSystem";
import User from "@/models/user/User";
import { v4 as uuidv4 } from 'uuid';

let testStore: Store;
let testInventory: Inventory;
let testGarden: Garden;
let testUser: User;

beforeEach(() => {
	const item1 = generateInventoryItem("appleSeed", 1);
	const item2 = generateInventoryItem("bananaSeed", 20);
	const item3 = generateInventoryItem("coconutSeed", 30);
	const testItemList = new InventoryItemList([item1, item2, item3]);
	testStore = new Store(uuidv4(), 1, "Test Store", 2.0, 1.0, 1, testItemList, new InventoryItemList());
	const item4 = generateInventoryItem("appleSeed", 1);
	const testItemList2 = new InventoryItemList([item4]);
	testInventory = new Inventory(uuidv4(), "Test User", 1000, testItemList2);
	testGarden = new Garden(uuidv4(), 6, 6, Garden.generateEmptyPlots(6, 6));
	testUser = new User(User.generateLocalUid(), "test user", "test", new LevelSystem(uuidv4()));
	testUser.addExp(10000000);
});

test('Should Get Row Expansion Cost', () => {
	let cost = GardenUpgrades.getRowExpansionCost(testGarden, testStore);
	expect(cost).toBe(5775);
	testGarden.addRow(testUser);
	cost = GardenUpgrades.getRowExpansionCost(testGarden, testStore);
	expect(cost).toBe(6675);
	testGarden.addColumn(testUser);
	cost = GardenUpgrades.getRowExpansionCost(testGarden, testStore);
	expect(cost).toBe(9100);

})

test('Should Get Column Expansion Cost', () => {
	let cost = GardenUpgrades.getColExpansionCost(testGarden, testStore);
	expect(cost).toBe(5775);
	testGarden.addRow(testUser);
	cost = GardenUpgrades.getColExpansionCost(testGarden, testStore);
	expect(cost).toBe(7875);
	testGarden.addColumn(testUser);
	cost = GardenUpgrades.getColExpansionCost(testGarden, testStore);
	expect(cost).toBe(9100);
})

test('Should Expand Row', () => {
	testInventory.addGold(10000000);
	let response = GardenUpgrades.expandRow(testGarden, testStore, testInventory, testUser);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(7);
	expect(testGarden.getCols()).toBe(6);
	response = GardenUpgrades.expandRow(testGarden, testStore, testInventory, testUser);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(8);
	expect(testGarden.getCols()).toBe(6);
})

test('Should Not Expand Row Insufficient Gold', () => {
	let response = GardenUpgrades.expandRow(testGarden, testStore, testInventory, testUser);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(1000);
})

test('Should Expand Column', () => {
	testInventory.addGold(10000000);
	let response = GardenUpgrades.expandColumn(testGarden, testStore, testInventory, testUser);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(6);
	expect(testGarden.getCols()).toBe(7);
	response = GardenUpgrades.expandColumn(testGarden, testStore, testInventory, testUser);
	expect(response.isSuccessful()).toBe(true);
	expect(testGarden.getRows()).toBe(6);
	expect(testGarden.getCols()).toBe(8);
})

test('Should Not Expand Column Insufficient Gold', () => {
	let response = GardenUpgrades.expandColumn(testGarden, testStore, testInventory, testUser);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.getGold()).toBe(1000);
})