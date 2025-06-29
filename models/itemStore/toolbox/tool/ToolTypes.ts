export const ToolTypes = Object.freeze({
	SHOVEL:   { name: "Shovel" }
  } as const);


export type ToolType = typeof ToolTypes[keyof typeof ToolTypes]["name"];