import Tool from "./Tool";
import ToolInterface from "./ToolInterface";

export default class Shovel extends Tool {

	//For now there's only 1 shovel, but in the future we might have a few types and need to index them
	constructor(id: string, name: string, type: string, icon: string, description: string, value: number, level: number) {
		super(id, name, type, icon, description, value, level);
	}

	static fromInterface(toolInterface: ToolInterface): Shovel | null {
		if (toolInterface.type != 'Shovel') {
			return null;
		}
		return new Shovel(toolInterface.id, toolInterface.name, toolInterface.type, toolInterface.icon, toolInterface.description, toolInterface.value, toolInterface.level);
	}

}