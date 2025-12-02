import { InventoryEgg } from "@/models/items/inventoryItems/InventoryEgg";
import { InventoryEggTemplate } from "@/models/items/templates/models/InventoryItemTemplates/InventoryEggTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { v4 as uuidv4 } from 'uuid';
import { EggDetails } from "@/models/items/EggDetails";

let inventoryEgg: InventoryEgg;
let eggTemplate: InventoryEggTemplate;
let eggDetails: EggDetails;

beforeEach(() => {
	const template = itemTemplateFactory.getInventoryItemTemplateByName('goose egg');
	if (!template || template.subtype !== 'InventoryEgg') {
		eggTemplate = InventoryEggTemplate.getErrorTemplate();
	} else {
		eggTemplate = template as InventoryEggTemplate;
	}
	
	eggDetails = {
		parent1: 'parent-goose-1',
		parent2: 'parent-goose-2',
		laidAt: Date.now(),
		hatchAt: Date.now() + 86400000, // 24 hours later
		isFertilized: true
	};
	
	inventoryEgg = new InventoryEgg(uuidv4(), eggTemplate, 1, eggDetails);
});

test('Should Initialize InventoryEgg Object', () => {
	expect(inventoryEgg).toBeTruthy();
	expect(inventoryEgg.itemData.subtype).toBe('InventoryEgg');
	expect(inventoryEgg.getQuantity()).toBe(1);
	expect(inventoryEgg.eggDetails.parent1).toBe('parent-goose-1');
	expect(inventoryEgg.eggDetails.parent2).toBe('parent-goose-2');
	expect(inventoryEgg.eggDetails.isFertilized).toBe(true);
});

test('Should Create InventoryEgg Object From PlainObject', () => {
	const plainObject = inventoryEgg.toPlainObject();
	const recreatedEgg = InventoryEgg.fromPlainObject(plainObject);
	
	expect(recreatedEgg).toBeTruthy();
	expect(recreatedEgg.itemData.name).toBe(inventoryEgg.itemData.name);
	expect(recreatedEgg.getQuantity()).toBe(inventoryEgg.getQuantity());
	expect(recreatedEgg.eggDetails.parent1).toBe(inventoryEgg.eggDetails.parent1);
	expect(recreatedEgg.eggDetails.parent2).toBe(inventoryEgg.eggDetails.parent2);
	expect(recreatedEgg.eggDetails.laidAt).toBe(inventoryEgg.eggDetails.laidAt);
	expect(recreatedEgg.eggDetails.hatchAt).toBe(inventoryEgg.eggDetails.hatchAt);
	expect(recreatedEgg.eggDetails.isFertilized).toBe(inventoryEgg.eggDetails.isFertilized);
});

test('Should Handle Invalid PlainObject', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	
	const invalidObject1 = { invalid: 'data' };
	const result1 = InventoryEgg.fromPlainObject(invalidObject1);
	expect(result1.itemData.name).toBe('error');
	expect(result1.getQuantity()).toBe(1);
	
	const invalidObject2 = {
		inventoryItemId: 'test-id',
		itemData: { name: 'invalid' },
		quantity: 'not-a-number',
		eggDetails: null
	};
	const result2 = InventoryEgg.fromPlainObject(invalidObject2);
	expect(result2.itemData.name).toBe('error');
	
	consoleErrorSpy.mockRestore();
});

test('Should Serialize and Deserialize InventoryEgg', () => {
	const serialized = JSON.stringify(inventoryEgg.toPlainObject());
	const deserialized = InventoryEgg.fromPlainObject(JSON.parse(serialized));
	
	expect(deserialized.itemData.id).toBe(inventoryEgg.itemData.id);
	expect(deserialized.getInventoryItemId()).toBe(inventoryEgg.getInventoryItemId());
	expect(deserialized.eggDetails).toEqual(inventoryEgg.eggDetails);
});

test('Should Update Quantity', () => {
	inventoryEgg.setQuantity(5);
	expect(inventoryEgg.getQuantity()).toBe(5);
	
	inventoryEgg.setQuantity(0);
	expect(inventoryEgg.getQuantity()).toBe(0);
});

test('Should Access Egg Details', () => {
	expect(inventoryEgg.eggDetails.isFertilized).toBe(true);
	expect(inventoryEgg.eggDetails.hatchAt).toBeGreaterThan(inventoryEgg.eggDetails.laidAt);
});

