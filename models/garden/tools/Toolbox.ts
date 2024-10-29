import Shovel from "./Shovel";
import Tool from "./Tool";
import { toolRepository } from "./ToolRepository";
import { ToolTypes } from "./ToolTypes";

export default class Toolbox {
	tools: Tool[];

	constructor(tools: Tool[] = []) {
		this.tools = tools;
	}

	static fromPlainObject(plainObject: any): Toolbox {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for Toolbox');
            }
			const tools = plainObject.tools.map((tool: any) => {
				if (!tool) return null;
				let toolInstance = toolRepository.getToolInterfaceById(tool.id);
				if (!toolInstance) {
					toolInstance = toolRepository.getToolInterfaceByName(tool.name);
				}
				if (!toolInstance) {
					console.error(`Could not find toolinstance matching ${tool.id}, ${tool.name}`);
					return null;
				}
				switch(toolInstance.type) {
					case ToolTypes.SHOVEL.name:
						return new Shovel(toolInstance.id, toolInstance.name, toolInstance.type, toolInstance.icon, toolInstance.description, toolInstance.value, toolInstance.level);
					default:
						console.error(`Could not find toolinstance matching ${tool.id}, ${tool.name}`);
						return null;
				}
			}).filter((tool: null | Tool) => tool !== null);
			return new Toolbox(tools);
		} catch (err) {
			console.error('Error creating Toolbox from plainObject:', err);
            return new Toolbox();
		}
	}

	toPlainObject(): any {
		const toReturn = {
			tools: this.tools.map(tool => {
				return {id: tool.id, name: tool.name};
			}) // Convert each Tool to a plain object
		};
		return toReturn;
	} 


}