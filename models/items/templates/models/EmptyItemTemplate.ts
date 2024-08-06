import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../interfaces/ItemTemplateRepository";
import { DecorationTemplate } from "./DecorationTemplate";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class EmptyItemTemplate extends PlacedItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string) {
		super(id, name, icon, type, subtype, value, transformId);
	}

	static getErrorTemplate() {
		return new EmptyItemTemplate("0009999", "error", "❌", "PlacedItem", "Ground", 0, "0009999");
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
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.GROUND.name) {
					throw new Error('Found non EmptyItem for EmptyItem template');
				}
				const typedTemplate = template as EmptyItemTemplate;
				return new EmptyItemTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.value, typedTemplate.transformId);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for EmptyItemTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.GROUND.name) {
				throw new Error('Invalid subtype property in plainObject for EmptyItemTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getPlacedItemTemplateInterfaceByName(name);
			if (template) {
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.GROUND.name) {
					throw new Error('Found non decoration for EmptyItem template');
				}
				const typedTemplate = template as EmptyItemTemplate;
				return new EmptyItemTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.value, typedTemplate.transformId);
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