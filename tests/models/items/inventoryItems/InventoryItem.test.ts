import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { BlueprintTemplate } from "@/models/items/templates/models/InventoryItemTemplates/BlueprintTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { SeedTemplate } from "@/models/items/templates/models/InventoryItemTemplates/SeedTemplate";
import { v4 as uuidv4 } from 'uuid';
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";

let seedItem: Seed;
let blueprintItem: Blueprint;
let harvestedItem: HarvestedItem;

beforeEach(() => {
	let template = itemTemplateFactory.getInventoryItemTemplateByName('apple seed') as SeedTemplate;
	seedItem = new Seed(uuidv4(), template, 1);
	let template2 = itemTemplateFactory.getInventoryItemTemplateByName('bench blueprint') as BlueprintTemplate;
	blueprintItem = new Blueprint(uuidv4(), template2, 1);
	let template3 = itemTemplateFactory.getInventoryItemTemplateByName('apple') as HarvestedItemTemplate;
	harvestedItem = new HarvestedItem(uuidv4(), template3, 1);
})

//This is breaking because we need to initialize specific classes. After this test we can just use the placeholder generating function which does it for us.
test('Should Initialize InventoryItem Object', () => {
	expect(seedItem).toBeTruthy();
	expect(seedItem.itemData.name).toBe('apple seed');
	expect(seedItem.getQuantity()).toBe(1);
	seedItem.setQuantity(3);
	expect(seedItem.getQuantity()).toBe(3);

	expect(blueprintItem).toBeTruthy();
	expect(blueprintItem.itemData.name).toBe('bench blueprint');
	expect(blueprintItem.getQuantity()).toBe(1);
	blueprintItem.setQuantity(3);
	expect(blueprintItem.getQuantity()).toBe(3);

	expect(harvestedItem).toBeTruthy();
	expect(harvestedItem.itemData.name).toBe('apple');
	expect(harvestedItem.getQuantity()).toBe(1);
	harvestedItem.setQuantity(3);
	expect(harvestedItem.getQuantity()).toBe(3);
})

test('Should Use Blueprint Item', () => {
	const response = blueprintItem.use(1);
	expect(blueprintItem.getQuantity()).toBe(0);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('bench');
})

test('Should Use Seed Item', () => {
	seedItem.setQuantity(3);
	const response = seedItem.use(2);
	expect(seedItem.getQuantity()).toBe(1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('apple');
})

test('Should Not Use HarvestedItem Item', () => {
	const response = harvestedItem.use(1);
	expect(harvestedItem.getQuantity()).toBe(1);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Not Use Item With 0 Quantity', () => {
	seedItem.setQuantity(0);
	const response = seedItem.use(1);
	expect(seedItem.getQuantity()).toBe(0);
	expect(response.isSuccessful()).toBe(false);
})

//InventoryItem does not have a functional fromPlainObject method
// test('Should Create InventoryItem Object From PlainObject', () => {
// 	const serializedInventoryItem = JSON.stringify((generateNewPlaceholderInventoryItem('apple seed', 1)).toPlainObject());
// 	const item = InventoryItem.fromPlainObject(JSON.parse(serializedInventoryItem));
// 	expect(item).toBeTruthy();
// 	expect(item.itemData.name).toBe('apple seed');
// 	expect(item.getQuantity()).toBe(1);
// })
