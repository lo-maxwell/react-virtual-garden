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

test('Should Create BlueprintTemplate Object From PlainObject', () => {
	const serializedItemTemplate = JSON.stringify(blueprintTemplate.toPlainObject());
	const item = BlueprintTemplate.fromPlainObject(JSON.parse(serializedItemTemplate));
	expect(item).toBeTruthy();
	expect(item.name).toBe('bench blueprint');
	expect(item.id).toBe("1050400");
})


test('Should Not Create BlueprintTemplate Object From Corrupted Data', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const errorTemplate1 = BlueprintTemplate.fromPlainObject(123);
	expect(errorTemplate1.name).toBe('error');
	const errorTemplate2 = BlueprintTemplate.fromPlainObject({name: "a", icon: "abc", type: "InventoryItem", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate2.name).toBe('error');
	const errorTemplate3 = BlueprintTemplate.fromPlainObject({id: "1", icon: "abc", type: "InventoryItem", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate3.name).toBe('error');
	const errorTemplate4 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", type: "InventoryItem", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate4.name).toBe('error');
	const errorTemplate5 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate5.name).toBe('error');
	const errorTemplate6 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", value: 0, transformId: "1"});
	expect(errorTemplate6.name).toBe('error');
	const errorTemplate7 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Blueprint", transformId: "1"});
	expect(errorTemplate7.name).toBe('error');
	const errorTemplate8 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Blueprint", value: 0});
	expect(errorTemplate8.name).toBe('error');
	const errorTemplate9 = BlueprintTemplate.fromPlainObject({id: 1, name: "a", icon: "abc", type: "InventoryItem", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate9.name).toBe('error');
	const errorTemplate10 = BlueprintTemplate.fromPlainObject({id: "1", name: 1, icon: "abc", type: "InventoryItem", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate10.name).toBe('error');
	const errorTemplate11 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: 1, type: "InventoryItem", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate11.name).toBe('error');
	const errorTemplate12 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Blueprint", value: 0, transformId: "1"});
	expect(errorTemplate12.name).toBe('error');
	const errorTemplate13 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Plant", value: 0, transformId: "1"});
	expect(errorTemplate13.name).toBe('error');
	const errorTemplate14 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Blueprint", value: "0", transformId: "1"});
	expect(errorTemplate14.name).toBe('error');
	const errorTemplate15 = BlueprintTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Blueprint", value: 0, transformId: 1});
	expect(errorTemplate15.name).toBe('error');
	consoleErrorSpy.mockRestore();
})