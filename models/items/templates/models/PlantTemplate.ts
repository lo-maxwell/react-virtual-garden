import { ItemType, ItemSubtype, ItemTypes, ItemSubtypes } from "../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../interfaces/ItemTemplateRepository";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class PlantTemplate extends PlacedItemTemplate{
	baseExp: number;
	growTime: number;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, transformId: string, baseExp: number, growTime: number) {
		super(id, name, icon, type, subtype, category, description, value, transformId);
		this.baseExp = baseExp;
		this.growTime = growTime;
	}

	static getErrorTemplate() {
		return new PlantTemplate("0-02-99-99-99", "error", "❌", "PlacedItem", "Plant", "Error", "Error", 0, "1-03-99-99-99", 0, 0);
	}

	static fromPlainObject(plainObject: any): PlantTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for PlantTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for PlantTemplate');
			}
			let template = itemTemplateInterfaceRepository.getPlacedTemplateInterface(id);
			if (template) {
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.PLANT.name) {
					throw new Error('Found non Plant for Plant template');
				}
				const typedTemplate = template as PlantTemplate;
				return new PlantTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.transformId, typedTemplate.baseExp, typedTemplate.growTime);
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for PlantTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.PLANT.name) {
				throw new Error('Invalid subtype property in plainObject for PlantTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getPlacedItemTemplateInterfaceByName(name);
			if (template) {
				if (template.name === 'error') {
					throw new Error('Cannot create error template');
				}
				if (template.subtype !== ItemSubtypes.PLANT.name) {
					throw new Error('Found non decoration for Plant template');
				}
				const typedTemplate = template as PlantTemplate;
				return new PlantTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.transformId, typedTemplate.baseExp, typedTemplate.growTime);
			}
			throw new Error('Could not find valid id or name for PlantTemplate');
		} catch (err) {
			console.error('Error creating PlantTemplate from plainObject:', err);
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