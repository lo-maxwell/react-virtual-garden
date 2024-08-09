import { PlacedItemTemplateInterface } from "./PlacedItemTemplateInterface";

export interface PlantTemplateInterface extends PlacedItemTemplateInterface {
	baseExp: number;
	growTime: number;
	// Additional properties specific to inventory items, if any.
  }