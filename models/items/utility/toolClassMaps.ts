import { ShovelTemplate } from "../templates/models/ToolTemplates/ShovelTemplate";
import ToolTemplate from "../templates/models/ToolTemplates/ToolTemplate";
import Shovel from "../tools/Shovel";
import { Tool } from "../tools/Tool";




export type ToolConstructor<T extends Tool> = {
    new (...args: any[]): T;
    fromPlainObject(plainObject: any): T; // Static method example
    // Add other static methods if necessary
};

export const toolTypeMap: { [key: string]: ToolConstructor<Tool>} = {
	'Shovel': Shovel
}

export type ToolTemplateConstructor<T extends ToolTemplate> = {
    new (...args: any[]): T;
    fromPlainObject(plainObject: any): T; // Static method example
    // Add other static methods if necessary
};

export const toolTemplateMap: { [key: string]: ToolTemplateConstructor<ToolTemplate>} = {
	'Shovel': ShovelTemplate
}

/**
 * Get the Class given an tool. Can be used as a constructor.
 * @tool Tool or Template
 * @returns the Tool Class
 */
export const getToolClassFromType = (tool: Tool | ToolTemplate): ToolConstructor<Tool> => {
	let ToolClass;
	if (tool instanceof ToolTemplate) {
		ToolClass = toolTypeMap[tool.type];
		if (!ToolClass) {
			throw new Error(`Unknown tool type: ${tool}`);
		}
	} else {
		ToolClass = toolTypeMap[tool.itemData.type];
		if (!ToolClass) {
			throw new Error(`Unknown tool type: ${tool.itemData}`);
		}
	}
	return ToolClass as ToolConstructor<Tool>;
} 


/**
 * Get the Template given an tool. Can be used as a constructor.
 * @tool Tool or Template
 * @returns the Tool Template
 */
 export const getToolTemplateFromType = (tool: ToolTemplate): ToolTemplateConstructor<ToolTemplate> => {
	let ToolClass = toolTemplateMap[tool.type];
	if (!ToolClass) throw new Error(`Unknown tool type: ${tool.type}`);
	return ToolClass as ToolTemplateConstructor<ToolTemplate>;
} 