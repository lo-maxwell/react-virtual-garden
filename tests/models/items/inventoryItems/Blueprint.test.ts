import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";
import { BlueprintTemplate } from "@/models/items/templates/models/BlueprintTemplate";
import { HarvestedItemTemplate } from "@/models/items/templates/models/HarvestedItemTemplate";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";
import { v4 as uuidv4 } from 'uuid';

let seedItem: Seed;
let blueprintItem: Blueprint;
let harvestedItem: HarvestedItem;

beforeEach(() => {
	let template = placeholderItemTemplates.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(uuidv4(), template, 1);
	let template2 = placeholderItemTemplates.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(uuidv4(), template2, 1);
	let template3 = placeholderItemTemplates.getInventoryItemTemplateByName('apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(uuidv4(), template3, 1);
})

test('Should Create Blueprint Object From PlainObject', () => {
	const serializedInventoryItem = JSON.stringify((generateNewPlaceholderInventoryItem('bench blueprint', 1)).toPlainObject());
	const item = Blueprint.fromPlainObject(JSON.parse(serializedInventoryItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('bench blueprint');
	expect(item.getQuantity()).toBe(1);
})