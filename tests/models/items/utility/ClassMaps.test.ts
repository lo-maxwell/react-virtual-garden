import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemSubtype, ItemTypes } from "@/models/items/ItemTypes";
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
import { getItemClassFromSubtype, getItemTemplateFromSubtype } from "@/models/items/utility/classMaps";
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

test('Should Get Class From Subtype', () => {
	const class1 = getItemClassFromSubtype(seedItem);
	expect(class1).toBe(Seed);
	const class2 = getItemClassFromSubtype(blueprintItem);
	expect(class2).toBe(Blueprint);
	const class3 = getItemClassFromSubtype(harvestedItem);
	expect(class3).toBe(HarvestedItem);
	const class4 = getItemClassFromSubtype(plantItem);
	expect(class4).toBe(Plant);
	const class5 = getItemClassFromSubtype(decorationItem);
	expect(class5).toBe(Decoration);
	const class6 = getItemClassFromSubtype(emptyItem);
	expect(class6).toBe(EmptyItem);
})

//TODO Test unhappy path

test('Should Not Get Class From Invalid Type', () => {
	try {
		const invalidClass = getItemClassFromSubtype(new Seed(uuidv4(), new SeedTemplate('1', '1', '1', "InventoryItem", "InvalidSubtype" as ItemSubtype, "", "", 1, 0, "1"), 1));
		// Fail test if above expression doesn't throw anything.
		fail();
	} catch (e) {
	}
	try {
		const invalidClass = getItemClassFromSubtype(new SeedTemplate('1', '1', '1', "InventoryItem", "InvalidSubtype" as ItemSubtype, "", "", 1, 0, "1"));
		// Fail test if above expression doesn't throw anything.
		fail();
	} catch (e) {
	}
})

test('Should Get Template From Subtype', () => {
	const template1 = getItemTemplateFromSubtype(seedTemplate);
	expect(template1).toBe(SeedTemplate);
	const template2 = getItemTemplateFromSubtype(blueprintTemplate);
	expect(template2).toBe(BlueprintTemplate);
	const template3 = getItemTemplateFromSubtype(harvestedTemplate);
	expect(template3).toBe(HarvestedItemTemplate);
	const template4 = getItemTemplateFromSubtype(plantTemplate);
	expect(template4).toBe(PlantTemplate);
	const template5 = getItemTemplateFromSubtype(decorationTemplate);
	expect(template5).toBe(DecorationTemplate);
	const template6 = getItemTemplateFromSubtype(emptyTemplate);
	expect(template6).toBe(EmptyItemTemplate);
})

test('Should Not Get Template From Invalid Type', () => {
	try {
		const invalidTemplate = getItemTemplateFromSubtype(new SeedTemplate('1', '1', '1', "InventoryItem", "InvalidSubtype" as ItemSubtype, "", "", 1, 0, "1"));
		// Fail test if above expression doesn't throw anything.
		fail();
	} catch (e) {
	}
})