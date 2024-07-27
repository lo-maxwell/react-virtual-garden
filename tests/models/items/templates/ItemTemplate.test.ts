import { SeedTemplate } from "@/models/items/templates/SeedTemplate";

//TODO: Add tests for different template types
test('Initialize itemTemplate', () => {
	const testSeedTemplate = new SeedTemplate(0, 'test', '', "InventoryItem", "Seed", 0, 0);
	expect(testSeedTemplate).toBeTruthy();
});

//Test Template Specific methods
// test('Should Create ItemTemplate Object From PlainObject', () => {
// 	const serializedItemTemplate = JSON.stringify((PlaceholderItemTemplates.PlaceHolderItems.appleSeed).toPlainObject());
// 	const item = ItemTemplate.fromPlainObject(JSON.parse(serializedItemTemplate));
// 	expect(item).toBeTruthy();
// 	expect(item.name).toBe('apple seed');
// 	expect(item.value).toBe(10);
// })
