import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { generatePlacedItem } from "@/models/items/ItemFactory";
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

test('Should Create Decoration Object From PlainObject', () => {
	const serializedPlacedItem = JSON.stringify((generatePlacedItem('bench', 'abc')).toPlainObject());
	const item = Decoration.fromPlainObject(JSON.parse(serializedPlacedItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('bench');
	expect(item.getStatus()).toBe('abc');
})