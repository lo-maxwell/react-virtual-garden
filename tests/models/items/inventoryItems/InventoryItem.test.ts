import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { generateNewPlaceholderInventoryItem } from "@/models/items/PlaceholderItems";

test('Should Initialize InventoryItem Object', () => {
	const item = new InventoryItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple, 1);
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe("harvested apple");
	expect(item.getQuantity()).toBe(1);
	item.setQuantity(3);
	expect(item.getQuantity()).toBe(3);
})

test('Should Use Blueprint Item', () => {
	const item = new InventoryItem(PlaceholderItemTemplates.PlaceHolderItems.benchBlueprint, 1);
	expect(item.getQuantity()).toBe(1);
	const response = item.use(1);
	expect(item.getQuantity()).toBe(0);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('bench');
})

test('Should Use Seed Item', () => {
	const item = new InventoryItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 3);
	expect(item.getQuantity()).toBe(3);
	const response = item.use(2);
	expect(item.getQuantity()).toBe(1);
	expect(response.isSuccessful()).toBe(true);
	expect(response.payload.newTemplate.name).toBe('apple');
})

test('Should Not Use HarvestedItem Item', () => {
	const item = new InventoryItem(PlaceholderItemTemplates.PlaceHolderItems.harvestedApple, 1);
	expect(item.getQuantity()).toBe(1);
	const response = item.use(1);
	expect(item.getQuantity()).toBe(1);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Not Use Item With 0 Quantity', () => {
	const item = new InventoryItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, 0);
	expect(item.getQuantity()).toBe(0);
	const response = item.use(1);
	expect(item.getQuantity()).toBe(0);
	expect(response.isSuccessful()).toBe(false);
})

test('Should Create InventoryItem Object From PlainObject', () => {
	const serializedInventoryItem = JSON.stringify((generateNewPlaceholderInventoryItem('appleSeed', 1)).toPlainObject());
	const item = InventoryItem.fromPlainObject(JSON.parse(serializedInventoryItem));
	expect(item).toBeTruthy();
	expect(item.itemData.name).toBe('apple seed');
	expect(item.getQuantity()).toBe(1);
})