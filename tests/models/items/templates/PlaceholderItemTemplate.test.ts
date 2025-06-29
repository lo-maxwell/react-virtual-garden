import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { BlueprintTemplate } from "@/models/items/templates/models/InventoryItemTemplates/BlueprintTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/InventoryItemTemplates/SeedTemplate";
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

test('Should Get Placed Item Template By Name', () => {
	const template = itemTemplateFactory.getPlacedItemTemplateByName('apple');
	expect(template).toBeTruthy;
	expect(template?.name).toBe('apple');

})

test('Should Not Get Placed Item Template By Unknown Name', () => {
	const template = itemTemplateFactory.getPlacedItemTemplateByName('invalidName');
	expect(template).toBe(null);
})

test('Should Not Get Error Placed Item Template', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const template = itemTemplateFactory.getPlacedItemTemplateByName('error');
	expect(template).toBe(null);
	consoleErrorSpy.mockRestore();
})

test('Should Get Inventory Item Template By Name', () => {
	const template = itemTemplateFactory.getInventoryItemTemplateByName('apple seed');
	expect(template).toBeTruthy;
	expect(template?.name).toBe('apple seed');
})

test('Should Not Get Inventory Item Template By Unknown Name', () => {
	const template = itemTemplateFactory.getInventoryItemTemplateByName('invalidName');
	expect(template).toBe(null);
})

test('Should Not Get Error Inventory Item Template', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const template = itemTemplateFactory.getInventoryItemTemplateByName('error');
	expect(template).toBe(null);
	consoleErrorSpy.mockRestore();
})

test('Should Get Transformed Placed Item Template By Id', () => {
	const template = itemTemplateFactory.getPlacedTemplateById(seedItem.itemData.transformId);
	expect(template).toBeTruthy;
	expect(template?.name).toBe('apple');
})

test('Should Not Get Transformed Placed Item Template By Unknown Id', () => {
	const template = itemTemplateFactory.getPlacedTemplateById(plantItem.itemData.transformId);
	expect(template).toBeFalsy();
})

// test('Should Not Get Error Transformed Placed Item Template', () => {
// })

test('Should Get Transformed Inventory Item Template By Id', () => {
	const template = itemTemplateFactory.getInventoryTemplateById(plantItem.itemData.transformId);
	expect(template).toBeTruthy;
	expect(template?.name).toBe('apple');
})

test('Should Not Get Transformed Inventory Item Template By Unknown Id', () => {
	const template = itemTemplateFactory.getInventoryTemplateById(seedItem.itemData.transformId);
	expect(template).toBeFalsy();
})

// test('Should Not Get Error Transformed Inventory Item Template', () => {
// })