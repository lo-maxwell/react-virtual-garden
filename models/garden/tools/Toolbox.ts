import Shovel from "./Shovel";
import Tool from "./Tool";
import { toolRepository } from "./ToolRepository";
import { ToolTypes } from "./ToolTypes";

/** TODO: Make this like itemlist, with immutable fields and helper functions to interact with it */
export default class Toolbox {
	private tools: Tool[];

	constructor(tools: Tool[] = []) {
		this.tools = tools;
	}

	static generateDefaultToolbox() {
		const defaultTools: Tool[] = [];
		const basicShovelInterface = toolRepository.getToolInterfaceByName("Basic Shovel");
		if (basicShovelInterface) {
			const basicShovel = Shovel.fromInterface(basicShovelInterface);
			if (basicShovel) defaultTools.push(basicShovel);
		}
		return new Toolbox(defaultTools);
	}

	static fromPlainObject(plainObject: any): Toolbox {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for Toolbox');
            }
			const tools: Tool[] = plainObject.tools.map((tool: any) => {
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

			if (tools.length == 0) {
				return Toolbox.generateDefaultToolbox();
			}
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

	/**
	 * @returns a copy of the tools within the list.
	 */
	 getAllTools(): Tool[] {
		return this.tools.slice();
	}

	/**
     * Get the size of the inventory.
     * @returns The number of tools in the toolbox.
     */
	 size(): number {
		return this.tools.length;
	}
}