import { ItemSubtype, ItemSubtypes, ItemType, ItemTypes } from "../../../ItemTypes";
import { InventoryItemTemplateInterface } from "../../interfaces/InventoryItemTemplates/InventoryItemTemplateInterface";
import { itemTemplateInterfaceRepository } from "../../interfaces/ItemTemplateInterfaceRepository";
import { InventoryItemTemplate } from "./InventoryItemTemplate";

export class SeedTemplate extends InventoryItemTemplate{
	transformId: string;
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number, transformId: string) {
		super(id, name, icon, type, subtype, category, description, value, level);
		this.transformId = transformId;
	}

	static getErrorTemplate() {
		return new SeedTemplate("1-01-99-99-99", "error", "❌", "InventoryItem", "Seed", "Error", "Error", 0, 0, "0-0-29-99-99");
	}

	static createSeedTemplateFromInterface(templateInterface: InventoryItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.SEED.name) {
			throw new Error('Found non seed for seed template');
		}
		const typedTemplate = templateInterface as SeedTemplate;
		return new SeedTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.level, typedTemplate.transformId);
	}

	static fromPlainObject(plainObject: any): SeedTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for SeedTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for SeedTemplate');
			}
			let template = itemTemplateInterfaceRepository.getInventoryTemplateInterface(id);
			if (template) {
				return SeedTemplate.createSeedTemplateFromInterface(template);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for SeedTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.SEED.name) {
				throw new Error('Invalid subtype property in plainObject for SeedTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getInventoryItemTemplateInterfaceByName(name);
			if (template) {
				return SeedTemplate.createSeedTemplateFromInterface(template);
			}
			throw new Error('Could not find valid id or name for SeedTemplate');
		} catch (err) {
			console.error('Error creating SeedTemplate from plainObject:', err);
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