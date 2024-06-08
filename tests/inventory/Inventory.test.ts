import { Inventory } from "@/models/inventory/Inventory";
import { ItemList } from "@/models/inventory/ItemList";

test('Should Initialize Default Inventory Object', () => {
	const inv = new Inventory("Dummy User", 100, new ItemList());
	expect(inv).toBeTruthy();
	expect(inv.gold).toBe(100);
	expect(inv.userId).toBe("Dummy User");
	expect(inv.items.size()).toBe(0);
});

// TODO: Test crud on inventory