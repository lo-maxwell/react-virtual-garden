import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";
import { DecorationTemplate } from "@/models/items/templates/models/DecorationTemplate";
import { EmptyItemTemplate } from "@/models/items/templates/models/EmptyItemTemplate";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/models/PlantTemplate";
import { v4 as uuidv4 } from 'uuid';

let plantItem: Plant;
let decorationItem: Decoration;
let emptyItem: EmptyItem;

beforeEach(() => {
	let template = placeholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(uuidv4(), template, '');
	let template2 = placeholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(uuidv4(), template2, '');
	let template3 = placeholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(uuidv4(), template3, 'ground');
})

test('Should Create Decoration Object From PlainObject', () => {
	const serializedPlacedItem = JSON.stringify((generateNewPlaceholderPlacedItem('bench', 'abc')).toPlainObject());
	const item = Decoration.fromPlainObject(JSON.parse(serializedPlacedItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('bench');
	expect(item.getStatus()).toBe('abc');
})