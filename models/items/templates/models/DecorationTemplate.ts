import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../interfaces/ItemTemplateRepository";
import { PlacedItemTemplateInterface } from "../interfaces/PlacedItemTemplateInterface";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class DecorationTemplate extends PlacedItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number, transformId: string) {
		super(id, name, icon, type, subtype, category, description, value, level, transformId);
	}

	static getErrorTemplate() {
		return new DecorationTemplate("0-04-99-99-99", "error", "❌", "PlacedItem", "Decoration", "Error", "Error", 0, 0, "1-05-99-99-99");
	}

	static createDecorationTemplateFromInterface(templateInterface: PlacedItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.DECORATION.name) {
			throw new Error('Found non decoration for decoration template');
		}
		const typedTemplate = templateInterface as DecorationTemplate;
		return new DecorationTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.level, typedTemplate.transformId);
	}

	static fromPlainObject(plainObject: any): DecorationTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for DecorationTemplate');
			}
			let template = itemTemplateInterfaceRepository.getPlacedTemplateInterface(id);
			if (template) {
				return DecorationTemplate.createDecorationTemplateFromInterface(template);
			}
			
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for DecorationTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.DECORATION.name) {
				throw new Error('Invalid subtype property in plainObject for DecorationTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getPlacedItemTemplateInterfaceByName(name);
			if (template) {
				return DecorationTemplate.createDecorationTemplateFromInterface(template);
			}
			throw new Error('Could not find valid id or name for DecorationTemplate');
		} catch (err) {
			console.error('Error creating DecorationTemplate from plainObject:', err);
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