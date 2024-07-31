import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { BlueprintTemplate } from "@/models/items/templates/BlueprintTemplate";
import { HarvestedItemTemplate } from "@/models/items/templates/HarvestedItemTemplate";
import PlaceholderItemTemplates from "@/models/items/templates/PlaceholderItemTemplate";
import { SeedTemplate } from "@/models/items/templates/SeedTemplate";

let seedItem: Seed;
let blueprintItem: Blueprint;
let harvestedItem: HarvestedItem;

beforeEach(() => {
	let template = PlaceholderItemTemplates.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(template, 1);
	let template2 = PlaceholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(template2, 1);
	let template3 = PlaceholderItemTemplates.getInventoryItemTemplateByName('harvested apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(template3, 1);
})

test('Should Create Seed Object From PlainObject', () => {
	const serializedInventoryItem = JSON.stringify((generateNewPlaceholderInventoryItem('apple seed', 1)).toPlainObject());
	const item = Seed.fromPlainObject(JSON.parse(serializedInventoryItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('apple seed');
	expect(item.getQuantity()).toBe(1);
})