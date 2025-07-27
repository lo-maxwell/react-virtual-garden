import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import { Store } from "@/models/itemStore/store/Store";
import colors from "../colors/colors";
import Tooltip from "../window/tooltip";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import RawIconDisplay from "../user/icon/RawIconDisplay";

const StoreItemTooltip = ({ children, item, store }: { children: React.ReactNode, item: InventoryItem, store: Store}) => {

	const RenderItemTooltipInfo = () => {
		// Common variables
		const subtype = item.itemData.subtype;
		const name = item.itemData.name;
		const icon = item.itemData.icon;
		const value = item.itemData.value;
		const category = item.itemData.category;

		// Seed-specific
		let plantedItem, plantTemplate, harvestedItem, harvestedTemplate;
		if (subtype === ItemSubtypes.SEED.name) {
			const seedData = item.itemData as import("@/models/items/templates/models/InventoryItemTemplates/SeedTemplate").SeedTemplate;
			plantedItem = itemTemplateFactory.getPlacedTemplateById(seedData.transformId);
			if (plantedItem && plantedItem.subtype === ItemSubtypes.PLANT.name) {
				plantTemplate = plantedItem as PlantTemplate;
				harvestedItem = itemTemplateFactory.getInventoryTemplateById(plantTemplate.transformId);
				if (harvestedItem && harvestedItem.subtype === ItemSubtypes.HARVESTED.name) {
					harvestedTemplate = harvestedItem as HarvestedItemTemplate;
				}
			}
		}

		// Blueprint-specific
		let decoration;
		if (subtype === ItemSubtypes.BLUEPRINT.name) {
			const blueprintData = item.itemData as import("@/models/items/templates/models/InventoryItemTemplates/BlueprintTemplate").BlueprintTemplate;
			decoration = itemTemplateFactory.getPlacedTemplateById(blueprintData.transformId);
		}

		// Error case
		if (name === "error") {
			return (
				<div> An error occurred! Please report this to the developers.</div>
			);
		}

		return (
			<div className="flex flex-col items-left min-w-0 flex-grow">
				{/* Top row: icon, name, value */}
				<div className="flex flex-row justify-between min-w-max">
					<div className="flex flex-row min-w-0">
						<RawIconDisplay icon={icon} width={6} height={6} additionalSettings={"mr-1"}/>
						<span>{name}</span>
					</div>
					<span className="ml-2 flex ">
						<span className="">💰</span>
						{value * (typeof store?.getBuyMultiplier === 'function' ? store.getBuyMultiplier() : 1)}
					</span>
				</div>

				{/* Subtype label and category */}
				{subtype === ItemSubtypes.SEED.name && (
					<>
						<div className={`${colors.blueprint.categoryTextColor} text-left`}>Seed</div>
						<div className={`${colors.harvested.categoryTextColor} text-left`}>Category: {category}</div>
					</>
				)}
				{subtype === ItemSubtypes.HARVESTED.name && (
					<>
						<div className={`${colors.harvested.categoryTextColor} text-left`}>Harvested</div>
						<div className={`${colors.harvested.categoryTextColor} text-left`}>Category: {category}</div>
					</>
				)}
				{subtype === ItemSubtypes.BLUEPRINT.name && (
					<div className={`${colors.blueprint.categoryTextColor} text-left`}>Blueprint</div>
				)}

				{/* Seed-specific extra info */}
				{subtype === ItemSubtypes.SEED.name && plantTemplate && harvestedTemplate && (
					<>
						<div>When planted: </div>
						<div className="flex flex-row justify-between">
							<div className="flex flex-row">
								<RawIconDisplay icon={plantTemplate.icon} width={6} height={6} additionalSettings={"mr-1"}/>
								<span>{plantTemplate.name}</span>
							</div>
							<span className="ml-2 flex ">
								<span className="">💰</span>
								{harvestedTemplate.value}
							</span>
						</div>
						{plantTemplate.numHarvests > 1 && <div>{plantTemplate.numHarvests.toString() + ' harvests'}</div>}
						<div>{plantTemplate.getGrowTimeString()}</div>
						<div>XP Gained: {plantTemplate.baseExp}</div>
					</>
				)}

				{/* Blueprint-specific extra info */}
				{subtype === ItemSubtypes.BLUEPRINT.name && decoration && (
					<>
						<div>When placed: </div>
						<div className="flex flex-row">
							<RawIconDisplay icon={decoration.icon} width={6} height={6} additionalSettings={"mr-1"}/>
							<span>{decoration.name}</span>
						</div>
					</>
				)}
			</div>
		);
	};

	const getBackgroundColor = () => {
		switch(item.itemData.subtype) {
			case ItemSubtypes.SEED.name:
				return colors.seed.inventoryTooltipBackground;
			case ItemSubtypes.HARVESTED.name:
				return colors.harvested.inventoryTooltipBackground;
			case ItemSubtypes.BLUEPRINT.name:
				return colors.blueprint.inventoryTooltipBackground;
			default:
				return "bg-gray-300";
		}
	}

	// const showTooltip = plot.getItemSubtype() === ItemSubtypes.GROUND.name ? 'OFF' : 'ON';

	return (
		<div className="w-full">
			<Tooltip content={RenderItemTooltipInfo()} position="top" backgroundColor={getBackgroundColor()} forceVisible={""} boxWidth={"300px"}>
				{children}
			</Tooltip>
		</div>
		);
}

export default StoreItemTooltip;