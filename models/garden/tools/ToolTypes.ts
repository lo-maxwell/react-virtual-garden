export const ToolTypes = Object.freeze({
	SHOVEL:   { name: "Shovel" }
  } as const);


export type ItemType = typeof ToolTypes[keyof typeof ToolTypes]["name"];