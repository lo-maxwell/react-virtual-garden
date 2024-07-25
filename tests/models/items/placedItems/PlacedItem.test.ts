import { PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";

test('Should Initialize PlacedItem Object', () => {
	const item = new PlacedItem(PlaceholderItemTemplates.PlaceHolderItems.apple, "newItem");
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe("apple");
	expect(item.getStatus()).toBe("newItem");
	item.setStatus("oldItem");
	expect(item.getStatus()).toBe("oldItem");

})

test('Should Use Decoration Item', () => {
	const item = new PlacedItem(PlaceholderItemTemplates.PlaceHolderItems.bench, 'placed');
	const response = item.use();
	expect(item.getStatus()).toBe('removed');
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('bench blueprint');
})

test('Should Use Plant Item', () => {
	const item = new PlacedItem(PlaceholderItemTemplates.PlaceHolderItems.apple, 'planted');
	const response = item.use();
	expect(item.getStatus()).toBe('removed');
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('harvested apple');
})

test('Should Not Use EmptyItem Item', () => {
	const item = new PlacedItem(PlaceholderItemTemplates.PlaceHolderItems.ground, 'ground');
	const response = item.use();
	expect(item.getStatus()).toBe('ground');
	expect(response.isSuccessful()).toBe(false);
})

test('Should Create PlacedItem Object From PlainObject', () => {
	const serializedPlacedItem = JSON.stringify((generateNewPlaceholderPlacedItem('apple', 'abc')).toPlainObject());
	const item = PlacedItem.fromPlainObject(JSON.parse(serializedPlacedItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('apple');
	expect(item.getStatus()).toBe('abc');
})