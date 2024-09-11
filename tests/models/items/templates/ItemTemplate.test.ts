import { InventoryItemTemplate } from "@/models/items/templates/models/InventoryItemTemplate";
import { PlacedItemTemplate } from "@/models/items/templates/models/PlacedItemTemplate";
import { SeedTemplate } from "@/models/items/templates/models/SeedTemplate";
import { v4 as uuidv4 } from 'uuid';


//TODO: Add tests for different template types
test('Initialize itemTemplate', () => {
	const testSeedTemplate = new SeedTemplate("0", 'test', '', "InventoryItem", "Seed", "", "", 0, 0, "0");
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

test('Should Not Call FromPlainObject on Inventory/PlacedItemTemplates', () => {
	try {
		const invalidTemplate = InventoryItemTemplate.fromPlainObject({});
		// Fail test if above expression doesn't throw anything.
		fail();
	} catch (e) {
	}
	try {
		const invalidTemplate = PlacedItemTemplate.fromPlainObject({});
		// Fail test if above expression doesn't throw anything.
		fail();
	} catch (e) {
	}
})