import { Tool } from "./Tool";
import { ShovelTemplate } from "../templates/models/ToolTemplates/ShovelTemplate";
import { v4 as uuidv4 } from 'uuid';

export default class Shovel extends Tool {

	itemData: ShovelTemplate;

	//For now there's only 1 shovel, but in the future we might have a few types and need to index them
	constructor(toolId: string, itemData: ShovelTemplate) {
		super(toolId, itemData);
		this.itemData = itemData;
	}

	// static fromInterface(toolInterface: ToolTemplateInterface): Shovel | null {
	// 	if (toolInterface.type != 'Shovel') {
	// 		return null;
	// 	}
	// 	return new Shovel(toolInterface.id, toolInterface.name, toolInterface.type, toolInterface.icon, toolInterface.description, toolInterface.value, toolInterface.level);
	// }

	static fromPlainObject(plainObject: any): Shovel {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object' || !plainObject.itemData) {
                throw new Error('Invalid plainObject structure for Shovel');
            }
			// Validate required properties
			const { toolId, itemData } = plainObject;

			if (!itemData || typeof toolId !== 'string') {
				throw new Error('Invalid properties in plainObject for Shovel');
			}
	
			// Validate itemData structure
			const validatedItemData = ShovelTemplate.fromPlainObject(itemData);
	
			return new Shovel(toolId, validatedItemData);
		} catch (err) {
			console.error('Error creating Shovel from plainObject:', err);
            return new Shovel(uuidv4(), ShovelTemplate.getErrorTemplate());
		}
	}

	toPlainObject(): any {
		return {
			toolId: this.toolId,
			itemData: this.itemData.toPlainObject()
		}
	} 

}