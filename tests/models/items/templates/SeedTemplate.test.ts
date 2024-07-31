import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { BlueprintTemplate } from "@/models/items/templates/BlueprintTemplate";
import { DecorationTemplate } from "@/models/items/templates/DecorationTemplate";
import { EmptyItemTemplate } from "@/models/items/templates/EmptyItemTemplate";
import { HarvestedItemTemplate } from "@/models/items/templates/HarvestedItemTemplate";
import PlaceholderItemTemplates from "@/models/items/templates/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/PlantTemplate";
import { SeedTemplate } from "@/models/items/templates/SeedTemplate";

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
	seedTemplate = PlaceholderItemTemplates.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(seedTemplate, 1);
	blueprintTemplate = PlaceholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(blueprintTemplate, 1);
	harvestedTemplate = PlaceholderItemTemplates.getInventoryItemTemplateByName('harvested apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(harvestedTemplate, 1);
	plantTemplate = PlaceholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(plantTemplate, '');
	decorationTemplate = PlaceholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(decorationTemplate, '');
	emptyTemplate = PlaceholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(emptyTemplate, 'ground');
})

test('Should Create SeedTemplate Object From PlainObject', () => {
	const serializedItemTemplate = JSON.stringify(seedTemplate.toPlainObject());
	const item = SeedTemplate.fromPlainObject(JSON.parse(serializedItemTemplate));
	expect(item).toBeTruthy();
	expect(item.name).toBe('apple seed');
	expect(item.id).toBe("1010100");
})

test('Should Not Create SeedTemplate Object From Corrupted Data', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const errorTemplate1 = SeedTemplate.fromPlainObject(123);
	expect(errorTemplate1.name).toBe('error');
	const errorTemplate2 = SeedTemplate.fromPlainObject({name: "a", icon: "abc", type: "InventoryItem", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate2.name).toBe('error');
	const errorTemplate3 = SeedTemplate.fromPlainObject({id: "1", icon: "abc", type: "InventoryItem", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate3.name).toBe('error');
	const errorTemplate4 = SeedTemplate.fromPlainObject({id: "1", name: "a", type: "InventoryItem", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate4.name).toBe('error');
	const errorTemplate5 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate5.name).toBe('error');
	const errorTemplate6 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", value: 0, transformId: "1"});
	expect(errorTemplate6.name).toBe('error');
	const errorTemplate7 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Seed", transformId: "1"});
	expect(errorTemplate7.name).toBe('error');
	const errorTemplate8 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Seed", value: 0});
	expect(errorTemplate8.name).toBe('error');
	const errorTemplate9 = SeedTemplate.fromPlainObject({id: 1, name: "a", icon: "abc", type: "InventoryItem", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate9.name).toBe('error');
	const errorTemplate10 = SeedTemplate.fromPlainObject({id: "1", name: 1, icon: "abc", type: "InventoryItem", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate10.name).toBe('error');
	const errorTemplate11 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: 1, type: "InventoryItem", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate11.name).toBe('error');
	const errorTemplate12 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "PlacedItem", subtype: "Seed", value: 0, transformId: "1"});
	expect(errorTemplate12.name).toBe('error');
	const errorTemplate13 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Plant", value: 0, transformId: "1"});
	expect(errorTemplate13.name).toBe('error');
	const errorTemplate14 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Seed", value: "0", transformId: "1"});
	expect(errorTemplate14.name).toBe('error');
	const errorTemplate15 = SeedTemplate.fromPlainObject({id: "1", name: "a", icon: "abc", type: "InventoryItem", subtype: "Seed", value: 0, transformId: 1});
	expect(errorTemplate15.name).toBe('error');
	consoleErrorSpy.mockRestore();
})