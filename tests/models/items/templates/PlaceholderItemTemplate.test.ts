import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { BlueprintTemplate } from "@/models/items/templates/models/BlueprintTemplate";
import { DecorationTemplate } from "@/models/items/templates/models/DecorationTemplate";
import { EmptyItemTemplate } from "@/models/items/templates/models/EmptyItemTemplate";
import { HarvestedItemTemplate } from "@/models/items/templates/models/HarvestedItemTemplate";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";

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
	seedTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(seedTemplate, 1);
	blueprintTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(blueprintTemplate, 1);
	harvestedTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('harvested apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(harvestedTemplate, 1);
	plantTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(plantTemplate, '');
	decorationTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(decorationTemplate, '');
	emptyTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(emptyTemplate, 'ground');
})

test('Should Get Placed Item Template By Name', () => {
	const template = placeholderItemTemplates.getPlacedItemTemplateByName('apple');
	expect(template).toBeTruthy;
	expect(template?.name).toBe('apple');

})

test('Should Not Get Placed Item Template By Unknown Name', () => {
	const template = placeholderItemTemplates.getPlacedItemTemplateByName('invalidName');
	expect(template).toBe(null);
})

test('Should Not Get Error Placed Item Template', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const template = placeholderItemTemplates.getPlacedItemTemplateByName('error');
	expect(template).toBe(null);
	consoleErrorSpy.mockRestore();
})

test('Should Get Inventory Item Template By Name', () => {
	const template = placeholderItemTemplates.getInventoryItemTemplateByName('apple seed');
	expect(template).toBeTruthy;
	expect(template?.name).toBe('apple seed');
})

test('Should Not Get Inventory Item Template By Unknown Name', () => {
	const template = placeholderItemTemplates.getInventoryItemTemplateByName('invalidName');
	expect(template).toBe(null);
})

test('Should Not Get Error Inventory Item Template', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const template = placeholderItemTemplates.getInventoryItemTemplateByName('error');
	expect(template).toBe(null);
	consoleErrorSpy.mockRestore();
})

test('Should Get Transformed Placed Item Template By Id', () => {
	const template = placeholderItemTemplates.getPlacedTemplate(seedItem.itemData.transformId);
	expect(template).toBeTruthy;
	expect(template?.name).toBe('apple');
})

test('Should Not Get Transformed Placed Item Template By Unknown Id', () => {
	const template = placeholderItemTemplates.getPlacedTemplate(plantItem.itemData.transformId);
	expect(template).toBeFalsy();
})

// test('Should Not Get Error Transformed Placed Item Template', () => {
// })

test('Should Get Transformed Inventory Item Template By Id', () => {
	const template = placeholderItemTemplates.getInventoryTemplate(plantItem.itemData.transformId);
	expect(template).toBeTruthy;
	expect(template?.name).toBe('harvested apple');
})

test('Should Not Get Transformed Inventory Item Template By Unknown Id', () => {
	const template = placeholderItemTemplates.getInventoryTemplate(seedItem.itemData.transformId);
	expect(template).toBeFalsy();
})

// test('Should Not Get Error Transformed Inventory Item Template', () => {
// })