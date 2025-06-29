import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { generateInventoryItem, generatePlacedItem } from "@/models/items/ItemFactory";
import { ItemTemplateRepository } from "@/models/items/templates/models/ItemTemplateRepository";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import { v4 as uuidv4 } from 'uuid';
import User from "@/models/user/User";


let testPlot: Plot;
let testInventory: Inventory;

beforeEach(() => {
	testPlot = new Plot(uuidv4(), generatePlacedItem('apple', ''), 0, 1);
	testInventory = new Inventory(uuidv4(), User.getDefaultUserName());
});

test('Should Initialize Plot Object', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 1, 1);
	expect(newPlot).toBeTruthy();
	expect(newPlot.getItem().itemData.name).toBe("apple");
	expect(newPlot.getItemStatus()).toBe("newItem");
	newPlot.setItem(generatePlacedItem("banana", "new item"), 1);
	newPlot.setItemStatus("old item");
	expect(newPlot.getItem().itemData.name).toBe("banana");
	expect(newPlot.getItemStatus()).toBe("old item");
	expect(newPlot.getPlantTime()).toBe(1);
	expect(newPlot.getUsesRemaining()).toBe((itemTemplateFactory.getPlacedItemTemplateByName('banana')! as PlantTemplate).numHarvests);
	newPlot.setUsesRemaining(100);
	newPlot.setPlantTime(100);
	expect(newPlot.getPlantTime()).toBe(100);
	expect(newPlot.getUsesRemaining()).toBe(100);

})

test('Should Use Decoration Item And Replace', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("bench", "newItem"), 0, 1);
	const response = newPlot.useItem(generatePlacedItem("apple", "replaced"), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(newPlot.getItemStatus()).toBe('replaced');
	expect(response.payload.newTemplate.name).toBe('bench blueprint');
})

test('Should Use Plant Item And Replace', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('banana');
	expect(newPlot.getItemStatus()).toBe('replaced');
	expect(response.payload.newTemplate.name).toBe('apple');
})

test('Should Use Plant Item And Not Replace', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 10);
	const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(newPlot.getItemStatus()).toBe('newItem');
	expect(response.payload.newTemplate.name).toBe('apple');
	expect(newPlot.getUsesRemaining()).toBe(9);
})

test('Should Use And Replace With Ground', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const response = newPlot.useItem();
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(newPlot.getItemStatus()).toBe('');
	expect(response.payload.newTemplate.name).toBe('apple');
})

test('Should Change Time on Use', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 1, 1);
	const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('banana');
	expect(newPlot.getItemStatus()).toBe('replaced');
	expect(response.payload.newTemplate.name).toBe('apple');
	expect(newPlot.getPlantTime()).not.toBe(1);
})

test('Should Use Not Plant Item With Missing UsesRemaining', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 10);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Not Use EmptyItem Item', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
	const response = newPlot.useItem(generatePlacedItem("banana", "replaced"), 1);
	expect(response.isSuccessful()).toBe(false);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(newPlot.getItemStatus()).toBe('newItem');
})

test('Should Place Apple Seed Item', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple seed', 1)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('apple seed').payload);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(response.payload.newItem.itemData.name).toBe('apple');
	expect(testInventory.contains('apple seed').payload).toBe(false);
})

test('Should Place Bench Item', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('bench blueprint', 2)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('bench blueprint').payload);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('bench');
	expect(response.payload.newItem.itemData.name).toBe('bench');
	expect(testInventory.contains('bench blueprint').payload).toBe(true);
	expect(testInventory.getItem('bench blueprint').payload.quantity).toBe(1);
})

test('Should Not Place on Non Ground', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('bench blueprint', 2)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('bench blueprint').payload);
	expect(response.isSuccessful()).toBe(false);
	expect(testInventory.contains('bench blueprint').payload).toBe(true);
	expect(testInventory.getItem('bench blueprint').payload.quantity).toBe(2);
})

test('Should Not Place Harvested Item', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple', 1)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('apple').payload);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Not Place Item With 0 Quantity', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple seed', 0)]));
	const response = newPlot.placeItem(testInventory, testInventory.getItem('apple seed').payload);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Pickup Apple Item', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([generateInventoryItem('apple', 1)]));
	const response = newPlot.pickupItem(testInventory, generatePlacedItem("ground", ""));
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(response.payload.newItem.itemData.name).toBe('apple');
	expect(testInventory.contains('apple').payload).toBe(true);
	expect(testInventory.getItem('apple').payload.quantity).toBe(2);
})

test('Should Pickup Bench Item', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("bench", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList());
	const response = newPlot.pickupItem(testInventory);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(response.payload.newItem.itemData.name).toBe('bench blueprint');
	expect(testInventory.contains('bench blueprint').payload).toBe(true);
	expect(testInventory.getItem('bench blueprint').payload.quantity).toBe(1);
})

test('Should Not Pickup Non Plant/Decoration', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("ground", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100, new InventoryItemList([]));
	const response = newPlot.pickupItem(testInventory);
	expect(response.isSuccessful()).toBe(false);
	expect(newPlot.getItem().itemData.name).toBe("ground");
	expect(testInventory.size()).toBe(0);
})

test('Should Harvest Apple', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100);
	const response = newPlot.harvestItem(testInventory, false, 1, generatePlacedItem('ground', ''), 1000000);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(response.payload.newItem.itemData.name).toContain('apple');
	expect(testInventory.contains(response.payload.newItem.itemData.name).payload).toBe(true);
	expect(testInventory.getItem(response.payload.newItem.itemData.name).payload.quantity).toBe(1);
})

test('Should Not Harvest Ungrown Apple', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100);
	const response = newPlot.harvestItem(testInventory, false, 1, generatePlacedItem('ground', ''), 5000);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Harvest Ungrown Apple If InstantGrow On', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("apple", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100);
	const response = newPlot.harvestItem(testInventory, true, 1, generatePlacedItem('ground', ''), 5000);
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(response.payload.newItem.itemData.name).toContain('apple');
	expect(testInventory.contains(response.payload.newItem.itemData.name).payload).toBe(true);
	expect(testInventory.getItem(response.payload.newItem.itemData.name).payload.quantity).toBe(1);
})

test('Should Not Harvest Non Plant', () => {
	const newPlot = new Plot(uuidv4(), generatePlacedItem("bench", "newItem"), 0, 1);
	const testInventory = new Inventory(uuidv4(), "Dummy", 100);
	const response = newPlot.harvestItem(testInventory, true, 1, generatePlacedItem('ground', ''), 5000);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Create Plot Object From PlainObject', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const serializedPlot = JSON.stringify((new Plot(uuidv4(), generatePlacedItem('apple', 'abc'), 0, 1)).toPlainObject());
	const plot = Plot.fromPlainObject(JSON.parse(serializedPlot));
	expect(plot).toBeTruthy();
	expect(plot.getItem()).toBeTruthy();
	expect(plot.getItem().itemData.name).toBe('apple');
	expect(plot.getItemStatus()).toBe('abc');
	consoleErrorSpy.mockRestore();
})

test('Should Create Empty Plot Instead of Error Item On fromPlainObject', () => {
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const errorPlot = new Plot(uuidv4(), generatePlacedItem('error', ''), 0, 1);
	const serializedPlot = JSON.stringify(errorPlot.toPlainObject());
	const plot = Plot.fromPlainObject(JSON.parse(serializedPlot));
	expect(plot.getItem().itemData.name).toBe('ground');
	// Restore console.error
	consoleErrorSpy.mockRestore();
})

test('Should Get EXP Value', () => {
	const appleTemplate = itemTemplateFactory.getPlacedItemTemplateByName('apple') as PlantTemplate;
	expect(testPlot.getExpValue()).toBe(appleTemplate.baseExp);
})


test('Should Not Get EXP Value', () => {
	testPlot.pickupItem(testInventory);
	testInventory.gainItem(generateInventoryItem('bench blueprint', 1), 1);
	testPlot.placeItem(testInventory, testInventory.getItem('bench blueprint').payload);
	expect(testPlot.getExpValue()).toBe(0);
})