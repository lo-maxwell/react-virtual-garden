export const ItemTypes = Object.freeze({
	PLACED:   { name: "PlacedItem" },
	INVENTORY:  { name: "InventoryItem" }
  } as const);

export const ItemSubtypes = Object.freeze({
	PLANT:   { name: "Plant" },
	PLACED_EGG: { name: "PlacedEgg" },
	INVENTORY_EGG: { name: "InventoryEgg" },
	DECORATION:   { name: "Decoration" },
	GROUND:   { name: "Ground" },
	SEED:   { name: "Seed" },
	HARVESTED:   { name: "HarvestedItem" },
	BLUEPRINT:   { name: "Blueprint" },
} as const);

export type ItemType = typeof ItemTypes[keyof typeof ItemTypes]["name"];
export type ItemSubtype = typeof ItemSubtypes[keyof typeof ItemSubtypes]["name"];