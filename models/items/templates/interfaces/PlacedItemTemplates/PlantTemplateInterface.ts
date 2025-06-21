import { PlacedItemTemplateInterface } from "./PlacedItemTemplateInterface";

export interface TransformShinyId {
	id: string;
	probability: number;
}

export interface PlantTemplateInterface extends PlacedItemTemplateInterface {
	baseExp: number;
	growTime: number;
	repeatedGrowTime: number;
	numHarvests: number;
	transformShinyIds?: {
		[key: string]: TransformShinyId;
	};
}