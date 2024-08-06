import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../interfaces/ItemTemplateRepository";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class DecorationTemplate extends PlacedItemTemplate{
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, value: number, transformId: string) {
		super(id, name, icon, type, subtype, value, transformId);
	}

	static getErrorTemplate() {
		return new DecorationTemplate("0049999", "error", "❌", "PlacedItem", "Decoration", 0, "1059999");
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
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.DECORATION.name) {
					throw new Error('Found non decoration for decoration template');
				}
				const typedTemplate = template as DecorationTemplate;
				return new DecorationTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.value, typedTemplate.transformId);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for DecorationTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.DECORATION.name) {
				throw new Error('Invalid subtype property in plainObject for DecorationTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getPlacedItemTemplateInterfaceByName(name);
			if (template) {
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.DECORATION.name) {
					throw new Error('Found non decoration for decoration template');
				}
				const typedTemplate = template as DecorationTemplate;
				return new DecorationTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.value, typedTemplate.transformId);
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