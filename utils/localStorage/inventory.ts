import { Inventory } from "@/models/inventory/Inventory";

export const loadInventory = () => {
	try {
	  const serializedInventory = localStorage.getItem('inventory');
	  if (serializedInventory === null) {
		return [];
	  }
	  return Inventory.fromPlainObject(JSON.parse(serializedInventory));
	} catch (err) {
	  console.error('Could not load inventory', err);
	  return [];
	}
  };
  
export const saveInventory = (inventory: Inventory) => {
	try {
		const serializedInventory = JSON.stringify(inventory);
		localStorage.setItem('inventory', serializedInventory);
	} catch (err) {
		console.error('Could not save inventory', err);
	}
};