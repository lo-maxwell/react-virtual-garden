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
})

test('Should Initialize ItemHistory Object', () => {
	const newItemHistory = new ItemHistory(uuidv4(), plantTemplate, 0);
	expect(newItemHistory.getItemData().name).toBe('apple');
	expect(newItemHistory.getItemData().subtype).toBe(ItemSubtypes.PLANT.name);
	expect(newItemHistory.getQuantity()).toBe(0);
	newItemHistory.updateQuantity(100);
	expect(newItemHistory.getQuantity()).toBe(100);
	newItemHistory.updateQuantity(-99);
	expect(newItemHistory.getQuantity()).toBe(1);
})

test('Should Combine ItemHistory', () => {
	const newItemHistory1 = new ItemHistory(uuidv4(), plantTemplate, 10);
	const newItemHistory2 = new ItemHistory(uuidv4(), plantTemplate, 20);
	expect(newItemHistory1.getQuantity()).toBe(10);
	expect(newItemHistory2.getQuantity()).toBe(20);
	const combineResponse = newItemHistory1.combineHistory(newItemHistory2);
	expect(combineResponse.isSuccessful()).toBe(true);
	const plantHistory = combineResponse.payload as ItemHistory;
	expect(plantHistory.getQuantity()).toBe(30);
	expect(newItemHistory1.getQuantity()).toBe(30);
})


test('Should Not Combine ItemHistory With Invalid HarvestedQuantity', () => {
	const newItemHistory1 = new ItemHistory(uuidv4(), plantTemplate, 10);
	const newItemHistory2 = new ItemHistory(uuidv4(), plantTemplate, -20);
	expect(newItemHistory1.getQuantity()).toBe(10);
	expect(newItemHistory2.getQuantity()).toBe(-20);
	const combineResponse = newItemHistory1.combineHistory(newItemHistory2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(newItemHistory1.getQuantity()).toBe(10);
})

test('Should Not Combine ItemHistory With Different Templates', () => {
	const newItemHistory1 = new ItemHistory(uuidv4(), plantTemplate, 10);
	const plantTemplate2 = itemTemplateFactory.getPlacedItemTemplateByName('banana') as PlantTemplate;
	const newItemHistory2 = new ItemHistory(uuidv4(), plantTemplate2, 20);
	expect(newItemHistory1.getQuantity()).toBe(10);
	expect(newItemHistory2.getQuantity()).toBe(20);
	const combineResponse = newItemHistory1.combineHistory(newItemHistory2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(newItemHistory1.getQuantity()).toBe(10);
})

test('Should Create ItemHistory Object From PlainObject', () => {
	const newItemHistory1 = new ItemHistory(uuidv4(), plantTemplate, 10);
	const serializedHistory = JSON.stringify(newItemHistory1.toPlainObject());
	const history = ItemHistory.fromPlainObject(JSON.parse(serializedHistory));
	expect(history).toBeTruthy();
	expect(history?.getItemData().name).toBe('apple');
	expect(history?.getQuantity()).toBe(10);
})

test('Should Not Create Invalid ItemHistory Object From PlainObject', () => {	
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const corruptedHistory2 = ItemHistory.fromPlainObject(123);
	expect(corruptedHistory2).toBe(null);
	const corruptedHistory3 = ItemHistory.fromPlainObject({itemData: plantTemplate.toPlainObject(), harvestedQuantity: "abc"});
	expect(corruptedHistory3).toBe(null);
	consoleErrorSpy.mockRestore();
})