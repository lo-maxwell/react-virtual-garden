import { PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";

test('Should Initialize PlacedItem Object', () => {
	const item = new PlacedItem(PlaceholderItemTemplates.PlaceHolderItems.apple, "newItem");
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe("apple");
	expect(item.status).toBe("newItem");
	item.setStatus("oldItem");
	expect(item.getStatus()).toBe("oldItem");

})