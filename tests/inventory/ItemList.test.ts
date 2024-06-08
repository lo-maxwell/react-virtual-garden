import { ItemList } from "@/models/inventory/ItemList";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { generateNewPlaceholderInventoryItem, PlaceHolderItems } from "@/models/items/PlaceholderItems";

let testItemList: ItemList;

beforeEach(() => {
	const item1 = generateNewPlaceholderInventoryItem("appleSeed", 1);
	const item2 = generateNewPlaceholderInventoryItem("bananaSeed", 2);
	const item3 = generateNewPlaceholderInventoryItem("coconutSeed", 3);
	testItemList = new ItemList([item1, item2, item3]);
})

test('Should Initialize Default ItemList Object', () => {
	const inv = testItemList;
	expect(inv).toBeTruthy();
	expect(inv.size()).toBe(3);
});

test('Should Add Item to List', () => {
	const inv = new ItemList();
	expect(inv).toBeTruthy();
	expect(inv.size()).toBe(0);
});