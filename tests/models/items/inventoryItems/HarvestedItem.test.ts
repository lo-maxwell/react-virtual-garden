import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { BlueprintTemplate } from "@/models/items/templates/models/BlueprintTemplate";
import { HarvestedItemTemplate } from "@/models/items/templates/models/HarvestedItemTemplate";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";

let seedItem: Seed;
let blueprintItem: Blueprint;
let harvestedItem: HarvestedItem;

beforeEach(() => {
	let template = placeholderItemTemplates.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(template, 1);
	let template2 = placeholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(template2, 1);
	let template3 = placeholderItemTemplates.getInventoryItemTemplateByName('apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(template3, 1);
})

test('Should Create HarvestedItem Object From PlainObject', () => {
	const serializedInventoryItem = JSON.stringify((generateNewPlaceholderInventoryItem('apple', 1)).toPlainObject());
	const item = HarvestedItem.fromPlainObject(JSON.parse(serializedInventoryItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('apple');
	expect(item.getQuantity()).toBe(1);
})