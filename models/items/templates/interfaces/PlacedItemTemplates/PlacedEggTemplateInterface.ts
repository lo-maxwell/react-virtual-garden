import { PlacedItemTemplateInterface } from "./PlacedItemTemplateInterface";

export interface EggTemplateInterface extends PlacedItemTemplateInterface {
	// Additional properties specific to inventory items, if any.
	baseExp: number;
	growTime: number;
  }