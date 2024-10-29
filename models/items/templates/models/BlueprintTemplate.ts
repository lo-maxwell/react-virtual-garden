import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../ItemTypes";
import { InventoryItemTemplateInterface } from "../interfaces/InventoryItemTemplateInterface";
import { itemTemplateInterfaceRepository } from "../interfaces/ItemTemplateRepository";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class BlueprintTemplate extends InventoryItemTemplate{
	transformId: string;
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number, transformId: string) {
		super(id, name, icon, type, subtype, category, description, value, level);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new BlueprintTemplate("1-05-99-99-99", "error", "❌", "InventoryItem", "Blueprint", "Error", "Error", 0, 0, "0-04-99-99-99");
	}


	static createBlueprintTemplateFromInterface(templateInterface: InventoryItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.BLUEPRINT.name) {
			throw new Error('Found non blueprint for blueprint template');
		}
		const typedTemplate = templateInterface as BlueprintTemplate;
		return new BlueprintTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.level, typedTemplate.transformId);
	}

	static fromPlainObject(plainObject: any): BlueprintTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for InventoryItemTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for BlueprintTemplate');
			}
			let template = itemTemplateInterfaceRepository.getInventoryTemplateInterface(id);
			if (template) {
				return BlueprintTemplate.createBlueprintTemplateFromInterface(template);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for BlueprintTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.BLUEPRINT.name) {
				throw new Error('Invalid subtype property in plainObject for BlueprintTemplate');
			}
			template = itemTemplateInterfaceRepository.getInventoryItemTemplateInterfaceByName(name);
			if (template) {
				return BlueprintTemplate.createBlueprintTemplateFromInterface(template);
			}
			throw new Error('Could not find valid id or name for BlueprintTemplate');
		} catch (err) {
			console.error('Error creating BlueprintTemplate from plainObject:', err);
            return this.getErrorTemplate();
		}
	}

	toPlainObject(): any {
		return {
			id: this.id,
			name: this.name,
			subtype: this.subtype,
		}
	} 
}