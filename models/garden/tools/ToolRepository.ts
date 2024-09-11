import toolData from '@/data/garden/Tools.json';
import ToolInterface from "./ToolInterface";

export class ToolRepository {
	tools: ToolInterface[];

	constructor() {
		this.tools = [];
		this.loadTools();
	}

  	loadTools() {
		toolData.Tools.forEach((tool: any) => {
			this.tools.push(this.createTool(tool));
		})
  	}

	private createTool(tool: any): ToolInterface {
		return {
			id: tool.id,
			name: tool.name,
			type: tool.type,
			icon: tool.icon,
			description: tool.description,
			value: tool.value,
			level: tool.level,
		}
	}

	/**
	 * 
	 * @id the tool id
	 * @returns the found tool object or null
	 */
	 getToolInterfaceById(id: string): ToolInterface | null {
		const tools = Object.values(this.tools).flat().filter(tool => tool.id === id);
		if (tools.length === 1) return tools[0];
		else if (tools.length === 0) return null;
		else {
			console.error('Error: found multiple tools with the same id!');
			console.error(tools);
			return null;
		}
	}


	/**
	 * 
	 * @name the tool name
	 * @returns the found tool object or null
	 */
	 getToolInterfaceByName(name: string): ToolInterface | null {
		const tools = Object.values(this.tools).flat().filter(tool => tool.name === name);
		if (tools.length === 1) return tools[0];
		else if (tools.length === 0) return null;
		else {
			console.error('Error: found multiple tools with the same name!');
			console.error(tools);
			return null;
		}
	}

}

export const toolRepository = new ToolRepository();