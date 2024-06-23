import { Plot } from "@/models/garden/Plot";
import { PlaceholderItemTemplates } from "@/models/items/ItemTemplate";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { generateNewPlaceholderInventoryItem, generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";

test('Should Initialize Plot Object', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	expect(newPlot).toBeTruthy();
	expect(newPlot.getItem().itemData.name).toBe("apple");
	expect(newPlot.getItemStatus()).toBe("newItem");
	newPlot.setItem(generateNewPlaceholderPlacedItem("banana", "new item"));
	newPlot.setItemStatus("old item");
	expect(newPlot.getItem().itemData.name).toBe("banana");
	expect(newPlot.getItemStatus()).toBe("old item");

})

test('Should Use Decoration Item And Replace', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("bench", "newItem"));
	const response = newPlot.useItem(generateNewPlaceholderPlacedItem("apple", "replaced"));
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(newPlot.getItemStatus()).toBe('replaced');
	expect(response.payload.newTemplate.name).toBe('bench blueprint');
})

test('Should Use Plant Item And Replace', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const response = newPlot.useItem(generateNewPlaceholderPlacedItem("banana", "replaced"));
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('banana');
	expect(newPlot.getItemStatus()).toBe('replaced');
	expect(response.payload.newTemplate.name).toBe('harvested apple');
})

test('Should Use And Replace With Ground', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const response = newPlot.useItem();
	expect(response.isSuccessful()).toBe(true);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(newPlot.getItemStatus()).toBe('');
	expect(response.payload.newTemplate.name).toBe('harvested apple');
})

test('Should Not Use EmptyItem Item', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("ground", "newItem"));
	const response = newPlot.useItem(generateNewPlaceholderPlacedItem("banana", "replaced"));
	expect(response.isSuccessful()).toBe(false);
	expect(newPlot.getItem().itemData.name).toBe('ground');
	expect(newPlot.getItemStatus()).toBe('newItem');
})

test('Should Not Use Item And Replace With InventoryItem', () => {
	const newPlot = new Plot(generateNewPlaceholderPlacedItem("apple", "newItem"));
	const response = newPlot.useItem(new PlacedItem(PlaceholderItemTemplates.PlaceHolderItems.appleSeed, "invalid"));
	expect(response.isSuccessful()).toBe(false);
	expect(newPlot.getItem().itemData.name).toBe('apple');
	expect(newPlot.getItemStatus()).toBe('newItem');
})
