import { PlacedEgg } from "@/models/items/placedItems/PlacedEgg";
import { PlacedEggTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlacedEggTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { v4 as uuidv4 } from 'uuid';
import { EggDetails } from "@/models/items/EggDetails";

let placedEgg: PlacedEgg;
let eggTemplate: PlacedEggTemplate;
let eggDetails: EggDetails;

beforeEach(() => {
	const template = itemTemplateFactory.getPlacedItemTemplateByName('goose egg');
	if (!template || template.subtype !== 'PlacedEgg') {
		eggTemplate = PlacedEggTemplate.getErrorTemplate();
	} else {
		eggTemplate = template as PlacedEggTemplate;
	}
	
	eggDetails = {
		parent1: 'parent-goose-1',
		parent2: 'parent-goose-2',
		laidAt: Date.now(),
		hatchAt: Date.now() + 86400000, // 24 hours later
		isFertilized: true
	};
	
	placedEgg = new PlacedEgg(uuidv4(), eggTemplate, 'incubating', eggDetails);
});

test('Should Initialize PlacedEgg Object', () => {
	expect(placedEgg).toBeTruthy();
	expect(placedEgg.itemData.subtype).toBe('PlacedEgg');
	expect(placedEgg.getStatus()).toBe('incubating');
	expect(placedEgg.eggDetails.parent1).toBe('parent-goose-1');
	expect(placedEgg.eggDetails.parent2).toBe('parent-goose-2');
	expect(placedEgg.eggDetails.isFertilized).toBe(true);
});

test('Should Create PlacedEgg Object From PlainObject', () => {
	const plainObject = placedEgg.toPlainObject();
	const recreatedEgg = PlacedEgg.fromPlainObject(plainObject);
	
	expect(recreatedEgg).toBeTruthy();
	expect(recreatedEgg.itemData.name).toBe(placedEgg.itemData.name);
	expect(recreatedEgg.getStatus()).toBe(placedEgg.getStatus());
	expect(recreatedEgg.eggDetails.parent1).toBe(placedEgg.eggDetails.parent1);
	expect(recreatedEgg.eggDetails.parent2).toBe(placedEgg.eggDetails.parent2);
	expect(recreatedEgg.eggDetails.laidAt).toBe(placedEgg.eggDetails.laidAt);
	expect(recreatedEgg.eggDetails.hatchAt).toBe(placedEgg.eggDetails.hatchAt);
	expect(recreatedEgg.eggDetails.isFertilized).toBe(placedEgg.eggDetails.isFertilized);
});

test('Should Handle Invalid PlainObject', () => {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	
	const invalidObject1 = { invalid: 'data' };
	const result1 = PlacedEgg.fromPlainObject(invalidObject1);
	expect(result1.itemData.name).toBe('error');
	expect(result1.getStatus()).toBe('error');
	
	const invalidObject2 = {
		placedItemId: 'test-id',
		itemData: { name: 'invalid' },
		status: 'test',
		eggDetails: null
	};
	const result2 = PlacedEgg.fromPlainObject(invalidObject2);
	expect(result2.itemData.name).toBe('error');
	
	consoleErrorSpy.mockRestore();
});

test('Should Serialize and Deserialize PlacedEgg', () => {
	const serialized = JSON.stringify(placedEgg.toPlainObject());
	const deserialized = PlacedEgg.fromPlainObject(JSON.parse(serialized));
	
	expect(deserialized.itemData.id).toBe(placedEgg.itemData.id);
	expect(deserialized.getPlacedItemId()).toBe(placedEgg.getPlacedItemId());
	expect(deserialized.eggDetails).toEqual(placedEgg.eggDetails);
});

test('Should Update Status', () => {
	placedEgg.setStatus('hatched');
	expect(placedEgg.getStatus()).toBe('hatched');
});

test('Should Access Egg Details', () => {
	expect(placedEgg.eggDetails.isFertilized).toBe(true);
	expect(placedEgg.eggDetails.hatchAt).toBeGreaterThan(placedEgg.eggDetails.laidAt);
});

