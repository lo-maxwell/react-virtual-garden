import { ItemType, ItemSubtype, ItemTypes, ItemSubtypes } from "../../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../../interfaces/ItemTemplateInterfaceRepository";
import { PlacedItemTemplateInterface } from "../../interfaces/PlacedItemTemplates/PlacedItemTemplateInterface";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class PlantTemplate extends PlacedItemTemplate{
	baseExp: number;
	growTime: number;
	repeatedGrowTime: number;
	numHarvests: number;
	transformShinyIds: { [key: string]: { id: string; probability: number } };
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number, transformId: string, baseExp: number, growTime: number, repeatedGrowTime: number, numHarvests: number, transformShinyIds: { [key: string]: { id: string; probability: number } }) {
		super(id, name, icon, type, subtype, category, description, value, level, transformId);
		this.baseExp = baseExp;
		this.growTime = growTime;
		this.repeatedGrowTime = repeatedGrowTime;
		this.numHarvests = numHarvests;
		this.transformShinyIds = transformShinyIds;
	}

	static getErrorTemplate() {
		return new PlantTemplate("0-02-99-99-99", "error", "❌", "PlacedItem", "Plant", "Error", "Error", 0, 0, "1-03-99-99-99", 0, 0, 0, 1, {});
	}


	static createPlantTemplateFromInterface(templateInterface: PlacedItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.PLANT.name) {
			throw new Error('Found non plant for plant template');
		}
		const typedTemplate = templateInterface as PlantTemplate;
		return new PlantTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.level, typedTemplate.transformId, typedTemplate.baseExp, typedTemplate.growTime, typedTemplate.repeatedGrowTime, typedTemplate.numHarvests, typedTemplate.transformShinyIds);
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
				return PlantTemplate.createPlantTemplateFromInterface(template);	
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for PlantTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.PLANT.name) {
				throw new Error('Invalid subtype property in plainObject for PlantTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getPlacedItemTemplateInterfaceByName(name);
			if (template) {
				return PlantTemplate.createPlantTemplateFromInterface(template);	
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

	getGrowTimeString(): string {
		const growTime = this.growTime;

		if (growTime === 0) {
			return 'Grow Time: Instant';
		}

		// Calculate days, hours, minutes, and seconds
		const growDays = Math.floor(growTime / (24 * 3600));
		const growHours = Math.floor((growTime % (24 * 3600)) / 3600);
		const growMinutes = Math.floor((growTime % 3600) / 60);
		const growSeconds = Math.floor(growTime % 60);
	
		// Format components with leading zeros
		const formattedDays = growDays > 0 ? `${growDays} day${growDays > 1 ? 's' : ''}` : '';
		const formattedHours = growHours > 0 ? `${growHours} hour${growHours > 1 ? 's' : ''}` : '';
		const formattedMinutes = growMinutes > 0 ? `${growMinutes} min` : '';
		const formattedSeconds = growSeconds > 0 ? `${growSeconds} s` : '';
	
		// Combine the components
		let formattedString = 'Grow Time:';
		if (formattedDays) {
			formattedString += ` ${formattedDays}`;
		}
		if (formattedHours) {
			formattedString += ` ${formattedHours}`;
		}
		if (formattedMinutes && !formattedDays) {
			formattedString += ` ${formattedMinutes}`;
		}
		if (formattedSeconds && !formattedDays && !formattedHours) {
			formattedString += ` ${formattedSeconds}`;
		}
	
		return formattedString.trim(); // Remove any leading or trailing spaces
	}

}