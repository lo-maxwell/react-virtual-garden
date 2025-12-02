import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../../ItemTypes";
import { InventoryEggTemplateInterface } from "../../interfaces/InventoryItemTemplates/InventoryEggTemplateInterface";
import { InventoryItemTemplateInterface } from "../../interfaces/InventoryItemTemplates/InventoryItemTemplateInterface";
import { itemTemplateInterfaceRepository } from "../../interfaces/ItemTemplateInterfaceRepository";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class InventoryEggTemplate extends InventoryItemTemplate {
	transformId: string;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number, transformId: string) {
		super(id, name, icon, type, subtype, category, description, value, level);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new InventoryEggTemplate("1-07-99-99-99", "error", "❌", "InventoryItem", "InventoryEgg", "Error", "Error", 0, 0, "0-06-99-99-99");
	}

	static createInventoryEggTemplateFromInterface(templateInterface: InventoryItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.INVENTORY_EGG.name) {
			throw new Error('Found non InventoryEgg for InventoryEgg template');
		}
		const typedTemplate = templateInterface as InventoryEggTemplateInterface;
		return new InventoryEggTemplate(
			typedTemplate.id, 
			typedTemplate.name, 
			typedTemplate.icon, 
			typedTemplate.type, 
			typedTemplate.subtype, 
			typedTemplate.category, 
			typedTemplate.description, 
			typedTemplate.value, 
			typedTemplate.level, 
			typedTemplate.transformId
		);
	}

	static fromPlainObject(plainObject: any): InventoryEggTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for InventoryEggTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for InventoryEggTemplate');
			}
			let template = itemTemplateInterfaceRepository.getInventoryTemplateInterface(id);
			if (template) {
				return InventoryEggTemplate.createInventoryEggTemplateFromInterface(template);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for InventoryEggTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.INVENTORY_EGG.name) {
				throw new Error('Invalid subtype property in plainObject for InventoryEggTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getInventoryItemTemplateInterfaceByName(name);
			if (template) {
				return InventoryEggTemplate.createInventoryEggTemplateFromInterface(template);
			}
			throw new Error('Could not find valid id or name for InventoryEggTemplate');
		} catch (err) {
			console.error('Error creating InventoryEggTemplate from plainObject:', err);
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

