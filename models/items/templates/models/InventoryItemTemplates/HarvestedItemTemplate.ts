
import { ItemType, ItemSubtype, ItemSubtypes } from "@/models/items/ItemTypes";
import { InventoryItemTemplateInterface } from "../../interfaces/InventoryItemTemplates/InventoryItemTemplateInterface";
import { itemTemplateInterfaceRepository } from "../../interfaces/ItemTemplateInterfaceRepository";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class HarvestedItemTemplate extends InventoryItemTemplate{
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number) {
		super(id, name, icon, type, subtype, category, description, value, level);
	}

	static getErrorTemplate() {
		return new HarvestedItemTemplate("1-03-99-99-99", "error", "❌", "InventoryItem", "HarvestedItem", "Error", "Error", 0, 0);
	}

	static createHarvestedItemTemplateFromInterface(templateInterface: InventoryItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.HARVESTED.name) {
			throw new Error('Found non harvested item for harvested item template');
		}
		const typedTemplate = templateInterface as HarvestedItemTemplate;
		return new HarvestedItemTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.level);
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
				return HarvestedItemTemplate.createHarvestedItemTemplateFromInterface(template);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for HarvestedItemTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.HARVESTED.name) {
				throw new Error('Invalid subtype property in plainObject for HarvestedItemTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getInventoryItemTemplateInterfaceByName(name);
			if (template) {
				return HarvestedItemTemplate.createHarvestedItemTemplateFromInterface(template);
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