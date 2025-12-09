import { BlueprintTemplate } from "./InventoryItemTemplates/BlueprintTemplate";
import { PlacedItemTemplate } from "./PlacedItemTemplates/PlacedItemTemplate";
import { PlantTemplate } from "./PlacedItemTemplates/PlantTemplate";
import { SeedTemplate } from "./InventoryItemTemplates/SeedTemplate";
import itemsData from '@/data/final/current/Items.json';
import { HarvestedItemTemplate } from "./InventoryItemTemplates/HarvestedItemTemplate";
import { InventoryEggTemplate } from "./InventoryItemTemplates/InventoryEggTemplate";
import { InventoryItemTemplate } from "./InventoryItemTemplates/InventoryItemTemplate";
import { DecorationTemplate } from "./PlacedItemTemplates/DecorationTemplate";
import { EmptyItemTemplate } from "./PlacedItemTemplates/EmptyItemTemplate";
import ToolTemplate from "./ToolTemplates/ToolTemplate";
import { ShovelTemplate } from "./ToolTemplates/ShovelTemplate";
import { PlacedEggTemplate } from "./PlacedItemTemplates/PlacedEggTemplate";

export class ItemTemplateRepository {
	PlacedItems: Record<string, PlacedItemTemplate[]> = {};
	InventoryItems: Record<string, InventoryItemTemplate[]> = {};
  Tools: Record<string, ToolTemplate[]> = {};

	constructor() {
		this.loadItems();
	}

  	loadItems() {
    // Example to load PlacedItems > Plants
    this.PlacedItems['Plants'] = itemsData.PlacedItems.Plants.map((item: any) =>
      new PlantTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.category,
        item.description,
        item.value,
        item.level,
        item.transformId,
        item.baseExp,
		    item.growTime,
        item.repeatedGrowTime,
        item.numHarvests,
        item.transformShinyIds
      )
    );
    this.PlacedItems['PlacedEggs'] = itemsData.PlacedItems.PlacedEggs.map((item: any) =>
    new PlacedEggTemplate(
      item.id,
      item.name,
      item.icon,
      item.type,
      item.subtype,
      item.category,
      item.description,
      item.value,
      item.level,
      item.transformId,
      item.baseExp,
      item.growTime
    )
  );
	this.PlacedItems['Decorations'] = itemsData.PlacedItems.Decorations.map((item: any) =>
      new DecorationTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.category,
        item.description,
        item.value,
        item.level,
        item.transformId,
      )
    );
	this.PlacedItems['Ground'] = itemsData.PlacedItems.Ground.map((item: any) =>
      new EmptyItemTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.category,
        item.description,
        item.value,
        item.level,
        item.transformId
      )
    );
	this.InventoryItems['Seeds'] = itemsData.InventoryItems.Seeds.map((item: any) =>
      new SeedTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.category,
        item.description,
        item.value,
        item.level,
        item.transformId
      )
    );
	this.InventoryItems['HarvestedItems'] = itemsData.InventoryItems.HarvestedItems.map((item: any) =>
      new HarvestedItemTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.category,
        item.description,
        item.value,
        item.level
      )
    );
	this.InventoryItems['Blueprints'] = itemsData.InventoryItems.Blueprints.map((item: any) =>
      new BlueprintTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.category,
        item.description,
        item.value,
        item.level,
        item.transformId
      )
    );
	this.InventoryItems['InventoryEggs'] = itemsData.InventoryItems.InventoryEggs.map((item: any) =>
      new InventoryEggTemplate(
        item.id,
        item.name,
        item.icon,
        item.type,
        item.subtype,
        item.category,
        item.description,
        item.value,
        item.level,
        item.transformId
      )
    );
    this.Tools['Shovels'] = itemsData.Tools.Shovels.map((tool: any) =>
      new ShovelTemplate(
        tool.id,
        tool.name,
        tool.type,
        tool.icon,
        tool.description,
        tool.value, 
        tool.level
        )
    );
    // Repeat for other categories if needed
  	}
}
