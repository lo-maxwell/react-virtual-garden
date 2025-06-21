import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import { v4 as uuidv4 } from 'uuid';
import { DecorationTemplate } from "@/models/items/templates/models/PlacedItemTemplates/DecorationTemplate";
import { EmptyItemTemplate } from "@/models/items/templates/models/PlacedItemTemplates/EmptyItemTemplate";

let plantItem: Plant;
let decorationItem: Decoration;
let emptyItem: EmptyItem;

beforeEach(() => {
	let template = itemTemplateFactory.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(uuidv4(), template, '');
	let template2 = itemTemplateFactory.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(uuidv4(), template2, '');
	let template3 = itemTemplateFactory.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(uuidv4(), template3, 'ground');
})

test('Should Initialize PlacedItem Object', () => {
	expect(plantItem).toBeTruthy();
	expect(plantItem.itemData.name).toBe('apple');
	expect(plantItem.getStatus()).toBe('');
	plantItem.setStatus('changed');
	expect(plantItem.getStatus()).toBe('changed');

	expect(decorationItem).toBeTruthy();
	expect(decorationItem.itemData.name).toBe('bench');
	expect(decorationItem.getStatus()).toBe('');

	expect(emptyItem).toBeTruthy();
	expect(emptyItem.itemData.name).toBe('ground');
	expect(emptyItem.getStatus()).toBe('ground');

})

test('Should Use Decoration Item', () => {
	const item = decorationItem;
	const response = item.use();
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('bench blueprint');
})

test('Should Use Plant Item', () => {
	const item = plantItem;
	const response = item.use();
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('apple');
})

test('Should Not Use EmptyItem Item', () => {
	const item = emptyItem;
	const response = item.use();
	expect(item.getStatus()).toBe('ground');
	expect(response.isSuccessful()).toBe(false);
})

//PlacedItem does not have a functional fromPlainObject method
// test('Should Create PlacedItem Object From PlainObject', () => {
	// const serializedPlacedItem = JSON.stringify((generateNewPlaceholderPlacedItem('apple', 'abc')).toPlainObject());
	// const item = PlacedItem.fromPlainObject(JSON.parse(serializedPlacedItem));
	// expect(item).toBeTruthy();
	// expect(item.itemData.name).toBe('apple');
	// expect(item.getStatus()).toBe('abc');
// })