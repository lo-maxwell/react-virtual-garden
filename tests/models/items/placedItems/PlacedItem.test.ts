import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { PlaceHolderItems } from "@/models/items/PlaceholderItems";

test('Should Initialize PlacedItem Object', () => {
	const item = new PlacedItem(PlaceHolderItems.apple, "newItem");
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe("apple");
	expect(item.status).toBe("newItem");
	item.setStatus("oldItem");
	expect(item.getStatus()).toBe("oldItem");

})