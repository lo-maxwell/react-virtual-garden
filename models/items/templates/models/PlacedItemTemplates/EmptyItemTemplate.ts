
import { ItemType, ItemSubtype, ItemSubtypes } from "@/models/items/ItemTypes";
import { itemTemplateInterfaceRepository } from "../../interfaces/ItemTemplateInterfaceRepository";
import { PlacedItemTemplateInterface } from "../../interfaces/PlacedItemTemplates/PlacedItemTemplateInterface";
import { DecorationTemplate } from "./DecorationTemplate";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class EmptyItemTemplate extends PlacedItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number, transformId: string) {
		super(id, name, icon, type, subtype, category, description, value, level, transformId);
	}

	static getErrorTemplate() {
		return new EmptyItemTemplate("0-00-99-99-99", "error", "❌", "PlacedItem", "Ground", "Error", "Error", 0, 0, "0-00-99-99-99");
	}
	
	static createEmptyTemplateFromInterface(templateInterface: PlacedItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.GROUND.name) {
			throw new Error('Found non empty item for empty item template');
		}
		const typedTemplate = templateInterface as EmptyItemTemplate;
		return new EmptyItemTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.level, typedTemplate.transformId);
	}

	static fromPlainObject(plainObject: any): EmptyItemTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for EmptyItemTemplate');
			}
			let template = itemTemplateInterfaceRepository.getPlacedTemplateInterface(id);
			if (template) {
				return EmptyItemTemplate.createEmptyTemplateFromInterface(template);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for EmptyItemTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.GROUND.name) {
				throw new Error('Invalid subtype property in plainObject for EmptyItemTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getPlacedItemTemplateInterfaceByName(name);
			if (template) {
				return EmptyItemTemplate.createEmptyTemplateFromInterface(template);
			}
			throw new Error('Could not find valid id or name for EmptyItemTemplate');
		} catch (err) {
			console.error('Error creating EmptyItemTemplate from plainObject:', err);
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