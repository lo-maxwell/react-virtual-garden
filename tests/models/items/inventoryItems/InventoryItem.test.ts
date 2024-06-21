import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { PlaceHolderItems } from "@/models/items/PlaceholderItems";

test('Should Initialize InventoryItem Object', () => {
	const item = new InventoryItem(PlaceHolderItems.harvestedApple, 1);
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe("harvested apple");
	expect(item.quantity).toBe(1);
	item.setQuantity(3);
	expect(item.getQuantity()).toBe(3);

})