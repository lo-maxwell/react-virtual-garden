import { ItemTemplate, PlaceholderItemTemplates } from "@/models/items/ItemTemplate";

test('Initialize itemTemplate', () => {
	const newItemTemplate = new ItemTemplate(1, "ground", ".", "PlacedItem", "Ground", 0, 1);
	expect(newItemTemplate).toBeTruthy();
});


test('Should Create ItemTemplate Object From PlainObject', () => {
	const serializedItemTemplate = JSON.stringify((PlaceholderItemTemplates.PlaceHolderItems.appleSeed).toPlainObject());
	const item = ItemTemplate.fromPlainObject(JSON.parse(serializedItemTemplate));
	expect(item).toBeTruthy();
	expect(item.name).toBe('apple seed');
	expect(item.basePrice).toBe(10);
})