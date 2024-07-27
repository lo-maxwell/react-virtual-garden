import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemTypes } from "@/models/items/ItemTypes";
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
import { getItemClassFromSubtype, getItemTemplateFromSubtype } from "@/models/items/utility/classMaps";


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