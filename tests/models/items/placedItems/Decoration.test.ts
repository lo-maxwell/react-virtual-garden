import { Decoration } from "@/models/items/placedItems/Decoration";
import { EmptyItem } from "@/models/items/placedItems/EmptyItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";
import { DecorationTemplate } from "@/models/items/templates/DecorationTemplate";
import { EmptyItemTemplate } from "@/models/items/templates/EmptyItemTemplate";
import PlaceholderItemTemplates from "@/models/items/templates/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/PlantTemplate";

let plantItem: Plant;
let decorationItem: Decoration;
let emptyItem: EmptyItem;

beforeEach(() => {
	let template = PlaceholderItemTemplates.getPlacedItemTemplateByName('apple') as PlantTemplate;
	plantItem = new Plant(template, '');
	let template2 = PlaceholderItemTemplates.getPlacedItemTemplateByName('bench') as DecorationTemplate;
	decorationItem = new Decoration(template2, '');
	let template3 = PlaceholderItemTemplates.getPlacedItemTemplateByName('ground') as EmptyItemTemplate;
	emptyItem = new EmptyItem(template3, 'ground');
})

test('Should Create Decoration Object From PlainObject', () => {
	const serializedPlacedItem = JSON.stringify((generateNewPlaceholderPlacedItem('bench', 'abc')).toPlainObject());
	const item = Decoration.fromPlainObject(JSON.parse(serializedPlacedItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('bench');
	expect(item.getStatus()).toBe('abc');
})