import { stringify } from "querystring";
import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../interfaces/ItemTemplateRepository";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class HarvestedItemTemplate extends InventoryItemTemplate{
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number) {
		super(id, name, icon, type, subtype, category, description, value);
	}

	static getErrorTemplate() {
		return new HarvestedItemTemplate("1-03-99-99-99", "error", "❌", "InventoryItem", "HarvestedItem", "Error", "Error", 0);
	}

	static fromPlainObject(plainObject: any): HarvestedItemTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for ItemTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for HarvestedItemTemplate');
			}
			let template = itemTemplateInterfaceRepository.getInventoryTemplateInterface(id);
			if (template) {
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.HARVESTED.name) {
					throw new Error('Found non HarvestedItem for HarvestedItem template');
				}
				const typedTemplate = template as HarvestedItemTemplate;
				return new HarvestedItemTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for HarvestedItemTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.HARVESTED.name) {
				throw new Error('Invalid subtype property in plainObject for HarvestedItemTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getInventoryItemTemplateInterfaceByName(name);
			if (template) {
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.HARVESTED.name) {
					throw new Error('Found non decoration for HarvestedItem template');
				}
				const typedTemplate = template as HarvestedItemTemplate;
				return new HarvestedItemTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value);
			}
			throw new Error('Could not find valid id or name for HarvestedItemTemplate');
		} catch (err) {
			console.error('Error creating HarvestedItemTemplate from plainObject:', err);
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