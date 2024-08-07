import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../interfaces/ItemTemplateRepository";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class BlueprintTemplate extends InventoryItemTemplate{
	transformId: string;
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, transformId: string) {
		super(id, name, icon, type, subtype, category, description, value);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new BlueprintTemplate("1-05-99-99-99", "error", "❌", "InventoryItem", "Blueprint", "Error", "Error", 0, "0-04-99-99-99");
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
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.BLUEPRINT.name) {
					throw new Error('Found non blueprint for blueprint template');
				}
				const blueprintTemplate = template as BlueprintTemplate;
				return new BlueprintTemplate(blueprintTemplate.id, blueprintTemplate.name, blueprintTemplate.icon, blueprintTemplate.type, blueprintTemplate.subtype, blueprintTemplate.category, blueprintTemplate.description, blueprintTemplate.value, blueprintTemplate.transformId);
				
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for BlueprintTemplate');
			}
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.BLUEPRINT.name) {
				throw new Error('Invalid subtype property in plainObject for BlueprintTemplate');
			}
			template = itemTemplateInterfaceRepository.getInventoryItemTemplateInterfaceByName(name);
			if (template) {
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.BLUEPRINT.name) {
					throw new Error('Found non blueprint for blueprint template');
				}
				const typedTemplate = template as BlueprintTemplate;
				return new BlueprintTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.transformId);
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