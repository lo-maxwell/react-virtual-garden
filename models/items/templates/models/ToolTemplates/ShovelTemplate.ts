import { ToolTypes } from "../../../../itemStore/toolbox/tool/ToolTypes";
import { itemTemplateInterfaceRepository } from "../../interfaces/ItemTemplateInterfaceRepository";
import ToolTemplateInterface from "../../interfaces/ToolTemplates/ToolTemplateInterface";
import ToolTemplate from "./ToolTemplate";


export class ShovelTemplate extends ToolTemplate{
	constructor(id: string, name: string, type: string, icon: string, description: string, value: number, level: number) {
		super(id, name, type, icon, description, value, level);
	}

	static getErrorTemplate() {
		return new ShovelTemplate("0", "error", "Shovel", "❌", "Error", 0, 0);
	}

	static createShovelTemplateFromInterface(templateInterface: ToolTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.type !== ToolTypes.SHOVEL.name) {
			throw new Error('Found non shovel for shovel template');
		}
		const typedTemplate = templateInterface as ShovelTemplate;
		return new ShovelTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.type, typedTemplate.icon, typedTemplate.description, typedTemplate.value, typedTemplate.level);
	}

	static fromPlainObject(plainObject: any): ShovelTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ToolTemplate');
            }
			const { id, name, type } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for ShovelTemplate');
			}
			let template = itemTemplateInterfaceRepository.getToolInterfaceById(id);
			if (template) {
				return ShovelTemplate.createShovelTemplateFromInterface(template);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for ShovelTemplate');
			}
			if (typeof type !== 'string' || type !== ToolTypes.SHOVEL.name) {
				throw new Error('Invalid type property in plainObject for ShovelTemplate');
			}
			template = itemTemplateInterfaceRepository.getToolInterfaceByName(name);
			if (template) {
				return ShovelTemplate.createShovelTemplateFromInterface(template);
			}
			throw new Error('Could not find valid id or name for ShovelTemplate');
		} catch (err) {
			console.error('Error creating ShovelTemplate from plainObject:', err);
            return this.getErrorTemplate();
		}
	}

	toPlainObject(): any {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
		}
	} 
}