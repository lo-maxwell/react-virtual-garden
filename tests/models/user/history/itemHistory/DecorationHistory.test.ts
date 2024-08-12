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
import { DecorationHistory } from "@/models/user/history/itemHistory/DecorationHistory";

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
	harvestedTemplate = placeholderItemTemplates.getInventoryItemTemplateByName('apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(harvestedTemplate, 1);
	plantTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(plantTemplate, '');
	decorationTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(decorationTemplate, '');
	emptyTemplate = placeholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(emptyTemplate, 'ground');
})

test('Should Initialize DecorationHistory Object', () => {
	const newDecorationHistory = new DecorationHistory(decorationTemplate, 0);
	expect(newDecorationHistory.getItemData().name).toBe('bench');
	expect(newDecorationHistory.getItemData().subtype).toBe(ItemSubtypes.DECORATION.name);
	expect(newDecorationHistory.getPlacedQuantity()).toBe(0);
	newDecorationHistory.updatePlacedQuantity(100);
	expect(newDecorationHistory.getPlacedQuantity()).toBe(100);
	newDecorationHistory.updatePlacedQuantity(-99);
	expect(newDecorationHistory.getPlacedQuantity()).toBe(1);
})

test('Should Combine DecorationHistory', () => {
	const newDecorationHistory1 = new DecorationHistory(decorationTemplate, 10);
	const newDecorationHistory2 = new DecorationHistory(decorationTemplate, 20);
	expect(newDecorationHistory1.getPlacedQuantity()).toBe(10);
	expect(newDecorationHistory2.getPlacedQuantity()).toBe(20);
	const combineResponse = newDecorationHistory1.combineHistory(newDecorationHistory2);
	expect(combineResponse.isSuccessful()).toBe(true);
	const plantHistory = combineResponse.payload as DecorationHistory;
	expect(plantHistory.getPlacedQuantity()).toBe(30);
	expect(newDecorationHistory1.getPlacedQuantity()).toBe(30);
})


test('Should Not Combine DecorationHistory With Invalid PlacedQuantity', () => {
	const newDecorationHistory1 = new DecorationHistory(decorationTemplate, 10);
	const newDecorationHistory2 = new DecorationHistory(decorationTemplate, -20);
	expect(newDecorationHistory1.getPlacedQuantity()).toBe(10);
	expect(newDecorationHistory2.getPlacedQuantity()).toBe(-20);
	const combineResponse = newDecorationHistory1.combineHistory(newDecorationHistory2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(newDecorationHistory1.getPlacedQuantity()).toBe(10);
})

test('Should Not Combine DecorationHistory With Different Templates', () => {
	const newDecorationHistory1 = new DecorationHistory(decorationTemplate, 10);
	const decorationTemplate2 = placeholderItemTemplates.getPlacedItemTemplateByName('flamingo') as DecorationTemplate;
	const newDecorationHistory2 = new DecorationHistory(decorationTemplate2, 20);
	expect(newDecorationHistory1.getPlacedQuantity()).toBe(10);
	expect(newDecorationHistory2.getPlacedQuantity()).toBe(20);
	const combineResponse = newDecorationHistory1.combineHistory(newDecorationHistory2);
	expect(combineResponse.isSuccessful()).toBe(false);
	expect(newDecorationHistory1.getPlacedQuantity()).toBe(10);
})

test('Should Create DecorationHistory Object From PlainObject', () => {
	const newDecorationHistory1 = new DecorationHistory(decorationTemplate, 10);
	const serializedHistory = JSON.stringify(newDecorationHistory1.toPlainObject());
	const history = DecorationHistory.fromPlainObject(JSON.parse(serializedHistory));
	expect(history).toBeTruthy();
	expect(history?.getItemData().name).toBe('bench');
	expect(history?.getPlacedQuantity()).toBe(10);
})

test('Should Not Create Invalid DecorationHistory Object From PlainObject', () => {	
	//Mute console error
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const newDecorationHistory1 = new DecorationHistory(plantTemplate as DecorationTemplate, 10);
	const serializedHistory = JSON.stringify(newDecorationHistory1.toPlainObject());
	const corruptedHistory1 = DecorationHistory.fromPlainObject(JSON.parse(serializedHistory));
	expect(corruptedHistory1).toBe(null);
	const corruptedHistory2 = DecorationHistory.fromPlainObject(123);
	expect(corruptedHistory2).toBe(null);
	const corruptedHistory3 = DecorationHistory.fromPlainObject({itemData: decorationTemplate.toPlainObject(), harvestedQuantity: "abc"});
	expect(corruptedHistory3).toBe(null);
	consoleErrorSpy.mockRestore();
})