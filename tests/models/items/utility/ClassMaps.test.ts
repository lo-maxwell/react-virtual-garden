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
import { getItemClassFromSubtype } from "@/models/items/utility/classMaps";


let seedItem: Seed;
let blueprintItem: Blueprint;
let harvestedItem: HarvestedItem;
let plantItem: Plant;
let decorationItem: Decoration;
let emptyItem: EmptyItem;

beforeEach(() => {
	let template = PlaceholderItemTemplates.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(template, 1);
	let template2 = PlaceholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(template2, 1);
	let template3 = PlaceholderItemTemplates.getInventoryItemTemplateByName('harvested apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(template3, 1);
	let template4 = PlaceholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(template4, '');
	let template5 = PlaceholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(template5, '');
	let template6 = PlaceholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(template6, 'ground');
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