import { generateNewPlaceholderPlacedItem } from "@/models/items/PlaceholderItems";
import { Plot } from "@/models/Plot";

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