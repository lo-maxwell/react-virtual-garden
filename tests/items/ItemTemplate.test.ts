import { ItemTemplate } from "@/models/items/ItemTemplate";

test('Initialize itemTemplate', () => {
	const newItemTemplate = new ItemTemplate(1, "ground", ".", "PlacedItem", "Ground", 0, 1);
	expect(newItemTemplate).toBeTruthy();
});