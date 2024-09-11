import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemSubtypes } from "@/models/items/ItemTypes";
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
import { PlantHistory } from "@/models/user/history/itemHistory/PlantHistory";
import { v4 as uuidv4 } from 'uuid';

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
	seedItem = new Seed(uuidv4(), seedTemplate, 1);
	blueprintTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(uuidv4(), blueprintTemplate, 1);
	harvestedTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(uuidv4(), harvestedTemplate, 1);
	plantTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(uuidv4(), plantTemplate, '');
	decorationTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(uuidv4(), decorationTemplate, '');
	emptyTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(uuidv4(), emptyTemplate, 'ground');
})

test('Should Initialize PlantHistory Object', () => {
	const newPlantHistory = new PlantHistory(plantTemplate, 0);
	expect(newPlantHistory.getItemData().name).toBe('apple');
	expect(newPlantHistory.getItemData().subtype).toBe(ItemSubtypes.PLANT.name);
	expect(newPlantHistory.getHarvestedQuantity()).toBe(0);
	newPlantHistory.updateHarvestedQuantity(100);
	expect(newPlantHistory.getHarvestedQuantity()).toBe(100);
	newPlantHistory.updateHarvestedQuantity(-99);
	expect(newPlantHistory.getHarvestedQuantity()).toBe(1);
})

test('Should Combine PlantHistory', () => {
	const newPlantHistory1 = new PlantHistory(plantTemplate, 10);
	const newPlantHistory2 = new PlantHistory(plantTemplate, 20);
	expect(newPlantHistory1.getHarvestedQuantity()).toBe(10);
	expect(newPlantHistory2.getHarvestedQuantity()).toBe(20);
	const combineResponse = newPlantHistory1.combineHistory(newPlantHistory2);
	expect(combineResponse.isSuccessful()).toBe(true);
	const plantHistory = combineResponse.payload as PlantHistory;
	expect(plantHistory.getHarvestedQuantity()).toBe(30);
	expect(newPlantHistory1.getHarvestedQuantity()).toBe(30);
})


test('Should Not Combine PlantHistory With Invalid HarvestedQuantity', () => {
	const newPlantHistory1 = new PlantHistory(plantTemplate, 10);
	const newPlantHistory2 = new PlantHistory(plantTemplate, -20);
	expect(newPlantHistory1.getHarvestedQuantity()).toBe(10);
	expect(newPlantHistory2.getHarvestedQuantity()).toBe(-20);
	const combineResponse = newPlantHistory1.combineHistory(newPlantHistory2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(newPlantHistory1.getHarvestedQuantity()).toBe(10);
})

test('Should Not Combine PlantHistory With Different Templates', () => {
	const newPlantHistory1 = new PlantHistory(plantTemplate, 10);
	const plantTemplate2 = placeholderItemTemplates.getPlacedItemTemplateByName('banana') as PlantTemplate;
	const newPlantHistory2 = new PlantHistory(plantTemplate2, 20);
	expect(newPlantHistory1.getHarvestedQuantity()).toBe(10);
	expect(newPlantHistory2.getHarvestedQuantity()).toBe(20);
	const combineResponse = newPlantHistory1.combineHistory(newPlantHistory2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(newPlantHistory1.getHarvestedQuantity()).toBe(10);
})

test('Should Create PlantHistory Object From PlainObject', () => {
	const newPlantHistory1 = new PlantHistory(plantTemplate, 10);
	const serializedHistory = JSON.stringify(newPlantHistory1.toPlainObject());
	const history = PlantHistory.fromPlainObject(JSON.parse(serializedHistory));
	expect(history).toBeTruthy();
	expect(history?.getItemData().name).toBe('apple');
	expect(history?.getHarvestedQuantity()).toBe(10);
})

test('Should Not Create Invalid PlantHistory Object From PlainObject', () => {	
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const newPlantHistory1 = new PlantHistory(decorationTemplate as PlantTemplate, 10);
	const serializedHistory = JSON.stringify(newPlantHistory1.toPlainObject());
	const corruptedHistory1 = PlantHistory.fromPlainObject(JSON.parse(serializedHistory));
	expect(corruptedHistory1).toBe(null);
	const corruptedHistory2 = PlantHistory.fromPlainObject(123);
	expect(corruptedHistory2).toBe(null);
	const corruptedHistory3 = PlantHistory.fromPlainObject({itemData: plantTemplate.toPlainObject(), harvestedQuantity: "abc"});
	expect(corruptedHistory3).toBe(null);
	consoleErrorSpy.mockRestore();
})