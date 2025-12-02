import { ItemType, ItemSubtype, ItemTypes, ItemSubtypes } from "../../../ItemTypes";
import { itemTemplateInterfaceRepository } from "../../interfaces/ItemTemplateInterfaceRepository";
import { PlacedItemTemplateInterface } from "../../interfaces/PlacedItemTemplates/PlacedItemTemplateInterface";
import { PlacedItemTemplate } from "./PlacedItemTemplate";

export class EggTemplate extends PlacedItemTemplate{
	baseExp: number;
	growTime: number;
	
	constructor(id: string, name: string, icon: string, type: ItemType, subtype: ItemSubtype, category: string, description: string, value: number, level: number, transformId: string, baseExp: number, growTime: number) {
		super(id, name, icon, type, subtype, category, description, value, level, transformId);
		this.baseExp = baseExp;
		this.growTime = growTime;
	}

	static getErrorTemplate() {
		return new EggTemplate("0-06-99-99-99", "error", "❌", "PlacedItem", "PlacedEgg", "Error", "Error", 0, 0, "1-03-99-99-99", 0, 0);
	}


	static createEggTemplateFromInterface(templateInterface: PlacedItemTemplateInterface) {
		if (templateInterface.name === 'error') {
			throw new Error('Cannot create error template');
		}
		if (templateInterface.subtype !== ItemSubtypes.PLACED_EGG.name) {
			throw new Error('Found non PlacedEgg for PlacedEgg template');
		}
		const typedTemplate = templateInterface as EggTemplate;
		return new EggTemplate(typedTemplate.id, typedTemplate.name, typedTemplate.icon, typedTemplate.type, typedTemplate.subtype, typedTemplate.category, typedTemplate.description, typedTemplate.value, typedTemplate.level, typedTemplate.transformId, typedTemplate.baseExp, typedTemplate.growTime);
	}

	static fromPlainObject(plainObject: any): EggTemplate {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for EggTemplate');
            }
			const { id, name, subtype } = plainObject;
			// Perform additional type checks if necessary
			if (typeof id !== 'string') {
				throw new Error('Invalid id property in plainObject for EggTemplate');
			}
			let template = itemTemplateInterfaceRepository.getPlacedTemplateInterface(id);
			if (template) {
				return EggTemplate.createEggTemplateFromInterface(template);	
			}
			if (typeof name !== 'string') {
				throw new Error('Invalid name property in plainObject for EggTemplate');
			}
			
			if (typeof subtype !== 'string' || subtype !== ItemSubtypes.PLACED_EGG.name) {
				throw new Error('Invalid subtype property in plainObject for EggTemplate');
			}
			
			template = itemTemplateInterfaceRepository.getPlacedItemTemplateInterfaceByName(name);
			if (template) {
				return EggTemplate.createEggTemplateFromInterface(template);	
			}
			throw new Error('Could not find valid id or name for EggTemplate');
		} catch (err) {
			console.error('Error creating EggTemplate from plainObject:', err);
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