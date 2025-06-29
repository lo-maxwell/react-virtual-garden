import { Plot } from "@/models/garden/Plot";
import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { BlueprintTemplate } from "@/models/items/templates/models/InventoryItemTemplates/BlueprintTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/InventoryItemTemplates/SeedTemplate";
import ItemHistory from "@/models/user/history/itemHistory/ItemHistory";
import { ItemHistoryList } from "@/models/user/history/ItemHistoryList";
import { v4 as uuidv4 } from 'uuid';
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { DecorationTemplate } from "@/models/items/templates/models/PlacedItemTemplates/DecorationTemplate";
import { EmptyItemTemplate } from "@/models/items/templates/models/PlacedItemTemplates/EmptyItemTemplate";

let seedItem: Seed;
let blueprintItem: Blueprint;
let harvestedItem: HarvestedItem;
let plantItem: Plant;
let decorationItem: Decoration;
let emptyItem: EmptyItem;
let seedTemplate: SeedTemplate;
let blueprintTemplate: BlueprintTemplate;
let harvestedTemplate: HarvestedItemTemplate;
let plantTemplate: PlantTemplate;
let decorationTemplate: DecorationTemplate;
let emptyTemplate: EmptyItemTemplate;
let plantHistory: ItemHistory;
let decorationHistory: ItemHistory;
let testItemHistoryList: ItemHistoryList;

beforeEach(() => {
	seedTemplate = itemTemplateFactory.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(uuidv4(), seedTemplate, 1);
	blueprintTemplate = itemTemplateFactory.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(uuidv4(), blueprintTemplate, 1);
	harvestedTemplate = itemTemplateFactory.getInventoryItemTemplateByName('apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(uuidv4(), harvestedTemplate, 1);
	plantTemplate = itemTemplateFactory.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(uuidv4(), plantTemplate, '');
	decorationTemplate = itemTemplateFactory.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(uuidv4(), decorationTemplate, '');
	emptyTemplate = itemTemplateFactory.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(uuidv4(), emptyTemplate, 'ground');
	plantHistory = new ItemHistory(uuidv4(), plantTemplate, 1);
	decorationHistory = new ItemHistory(uuidv4(), decorationTemplate, 1);
	testItemHistoryList = new ItemHistoryList();
})

test('Should Initialize ItemHistoryList Object', () => {
	const list = new ItemHistoryList();
	const addResponse = list.addItemHistory(plantHistory);
	expect(list.size()).toBe(1);
	expect(list.contains(plantTemplate));
})


test('Should Create ItemHistoryList Object From PlainObject', () => {
	const list = new ItemHistoryList();
	list.addItemHistory(plantHistory);
	list.addItemHistory(decorationHistory);
	const serializedHistory = JSON.stringify(list.toPlainObject());
	const history = ItemHistoryList.fromPlainObject(JSON.parse(serializedHistory));
	expect(history).toBeTruthy();
	expect(history.contains(plantTemplate).payload).toBe(true);
	expect(history.size()).toBe(2);
})

test('Should Not Create Invalid ItemHistoryList Object From PlainObject', () => {	
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const list = new ItemHistoryList();
	const invalidHistory = new ItemHistory(uuidv4(), emptyTemplate as PlantTemplate, -100);
	list.addItemHistory(invalidHistory);
	const corruptedHistory2 = ItemHistoryList.fromPlainObject(123);
	expect(corruptedHistory2.size()).toBe(0);
	const corruptedHistory3 = ItemHistoryList.fromPlainObject({itemHistories: [plantHistory, null]});
	expect(corruptedHistory3.size()).toBe(1);
	consoleErrorSpy.mockRestore();
})


test('Should Get History', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	const getResponse = testItemHistoryList.getHistory(plantHistory.getItemData());
	expect(getResponse.isSuccessful()).toBe(true);
	const getResponse2 = testItemHistoryList.getHistory(plantHistory.getItemData().id);
	expect(getResponse2.isSuccessful()).toBe(true);
	const getResponse3 = testItemHistoryList.getHistory(plantTemplate);
	expect(getResponse3.isSuccessful()).toBe(true);
})

test('Should Not Get Nonexistent History', () => {
	const getResponse = testItemHistoryList.getHistory(plantHistory.getItemData());
	expect(getResponse.isSuccessful()).toBe(false);
	const getResponse2 = testItemHistoryList.getHistory(plantHistory.getItemData().id);
	expect(getResponse2.isSuccessful()).toBe(false);
	const getResponse3 = testItemHistoryList.getHistory(plantTemplate);
	expect(getResponse3.isSuccessful()).toBe(false);
	const getResponse4 = testItemHistoryList.getHistory("invalid id");
	expect(getResponse4.isSuccessful()).toBe(false);
})

test('Should Contain History', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	const getResponse = testItemHistoryList.contains(plantHistory.getItemData());
	expect(getResponse.payload).toBe(true);
	const getResponse2 = testItemHistoryList.contains(plantHistory.getItemData().id);
	expect(getResponse2.payload).toBe(true);
	const getResponse3 = testItemHistoryList.contains(plantTemplate);
	expect(getResponse3.payload).toBe(true);
})

test('Should Not Contain Nonexistent History', () => {
	const getResponse = testItemHistoryList.contains(plantHistory.getItemData());
	expect(getResponse.payload).toBe(false);
	const getResponse2 = testItemHistoryList.contains(plantHistory.getItemData().id);
	expect(getResponse2.payload).toBe(false);
	const getResponse3 = testItemHistoryList.contains(plantTemplate);
	expect(getResponse3.payload).toBe(false);
	const getResponse4 = testItemHistoryList.contains("invalid id");
	expect(getResponse4.payload).toBe(false);
})

test('Should Get History By Subtype', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	testItemHistoryList.addItemHistory(decorationHistory);
	const histories = testItemHistoryList.getHistoriesBySubtype(ItemSubtypes.PLANT.name);
	expect(histories.length).toBe(1);
	expect(histories[0].getItemData().name).toBe(plantHistory.getItemData().name);
	const histories2 = testItemHistoryList.getHistoriesBySubtype(ItemSubtypes.DECORATION.name, 'Normal');
	expect(histories2.length).toBe(1);
	expect(histories2[0].getItemData().name).toBe(decorationHistory.getItemData().name);
})

test('Should Get Subtype List', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	const subtypes = testItemHistoryList.getAllSubtypes();
	expect(subtypes.length).toBe(1);
	expect(subtypes[0]).toBe('Plant');
	testItemHistoryList.addItemHistory(decorationHistory);
	const subtypes2 = testItemHistoryList.getAllSubtypes();
	expect(subtypes2.length).toBe(2);
	expect(subtypes2[0]).toBe('Plant');
	expect(subtypes2[1]).toBe('Decoration');

})

test('Should Get Category List', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	const categories = testItemHistoryList.getAllCategories(ItemSubtypes.PLANT.name);
	expect(categories.length).toBe(1);
	expect(categories[0]).toBe('Tree Fruit');
	testItemHistoryList.addItemHistory(decorationHistory);
	const categories2 = testItemHistoryList.getAllCategories(ItemSubtypes.DECORATION.name);
	expect(categories2.length).toBe(1);
	expect(categories2[0]).toBe('Normal');
})

test('Should Add New History to ItemHistoryList', () => {
	expect(testItemHistoryList.size()).toBe(0);
	const addResponse = testItemHistoryList.addItemHistory(plantHistory);
	expect(addResponse.isSuccessful()).toBe(true);
	expect(testItemHistoryList.size()).toBe(1);
	const addResponse2 = testItemHistoryList.addItemHistory(decorationHistory);
	expect(addResponse2.isSuccessful()).toBe(true);
	expect(testItemHistoryList.size()).toBe(2);
})

test('Should Add Existing History to ItemHistoryList', () => {
	expect(testItemHistoryList.size()).toBe(0);
	const addResponse = testItemHistoryList.addItemHistory(plantHistory);
	expect(addResponse.isSuccessful()).toBe(true);
	expect(testItemHistoryList.size()).toBe(1);
	const hist = testItemHistoryList.getHistory(plantHistory.getItemData()).payload as ItemHistory;
	expect(hist.getQuantity()).toBe(1);
	const addResponse2 = testItemHistoryList.addItemHistory(plantHistory);
	expect(addResponse2.isSuccessful()).toBe(true);
	const hist2 = testItemHistoryList.getHistory(plantHistory.getItemData()).payload as ItemHistory;
	expect(hist2.getQuantity()).toBe(2);
	expect(testItemHistoryList.size()).toBe(1);
})

test('Should Not Add Invalid History', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	const corruptedTemplate = new PlantTemplate(plantTemplate.id, '', '', 'PlacedItem', 'Decoration', '', '', 1, 1, '', 1, 1, 1, 1, {});
	const corruptedHistory = new ItemHistory(uuidv4(), corruptedTemplate, 1);
	const addResponse = testItemHistoryList.addItemHistory(corruptedHistory);
	expect(addResponse.isSuccessful()).toBe(false);
})

test('Should Directly Update History to ItemHistoryList', () => {
	expect(testItemHistoryList.size()).toBe(0);
	const addResponse = testItemHistoryList.addItemHistory(plantHistory);
	expect(addResponse.isSuccessful()).toBe(true);
	expect(testItemHistoryList.size()).toBe(1);
	const hist = testItemHistoryList.getHistory(plantHistory.getItemData()).payload as ItemHistory;
	expect(hist.getQuantity()).toBe(1);
	const updateResponse = testItemHistoryList.updateItemHistory(plantHistory);
	expect(updateResponse.isSuccessful()).toBe(true);
	const hist2 = testItemHistoryList.getHistory(plantHistory.getItemData()).payload as ItemHistory;
	expect(hist2.getQuantity()).toBe(2);
	expect(testItemHistoryList.size()).toBe(1);
})

test('Should Not Update Invalid History', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	const corruptedTemplate = new PlantTemplate(plantTemplate.id, '', '', 'PlacedItem', 'Decoration', '', '', 1, 1, '', 1, 1, 1, 1, {});
	const corruptedHistory = new ItemHistory(uuidv4(), corruptedTemplate, 1);
	const updateResponse = testItemHistoryList.updateItemHistory(corruptedHistory);
	expect(updateResponse.isSuccessful()).toBe(false);
	const updateResponse2 = testItemHistoryList.updateItemHistory(decorationHistory);
	expect(updateResponse2.isSuccessful()).toBe(false);
})

test('Should Delete History from ItemHistoryList', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	expect(testItemHistoryList.size()).toBe(1);
	testItemHistoryList.addItemHistory(decorationHistory);
	expect(testItemHistoryList.size()).toBe(2);
	const deleteResponse = testItemHistoryList.deleteHistory(plantHistory);
	expect(deleteResponse.isSuccessful()).toBe(true);
	expect(testItemHistoryList.size()).toBe(1);
	expect(testItemHistoryList.getAllHistories()[0].getItemData().name).toBe('bench');
})

test('Should Not Delete Nonexistent History from ItemHistoryList', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	expect(testItemHistoryList.size()).toBe(1);
	const deleteResponse = testItemHistoryList.deleteHistory(decorationHistory);
	expect(deleteResponse.isSuccessful()).toBe(false);
	expect(testItemHistoryList.size()).toBe(1);
})

test('Should Delete All Histories', () => {
	testItemHistoryList.addItemHistory(plantHistory);
	expect(testItemHistoryList.size()).toBe(1);
	testItemHistoryList.addItemHistory(decorationHistory);
	expect(testItemHistoryList.size()).toBe(2);
	const deleteResponse = testItemHistoryList.deleteAll();
	expect(testItemHistoryList.size()).toBe(0);
})