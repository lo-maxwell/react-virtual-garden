import { Utility } from "@/components/garden/utilityBar/utilityBar";
import User from "@/models/user/User";

export const buildGardenUtilities = (
  user: User,
  {
	onDestroyPlant,
    onPlantAll,
    onHarvestAll,
    onPickupAll
  }: {
	onDestroyPlant: () => void;
    onPlantAll: () => void;
    onHarvestAll: () => void;
    onPickupAll: () => void;
  }
): Utility[] => {
  const utilities: Utility[] = [];

  // Shovel from toolbox
  const shovel = user.getToolbox().getAllTools()[0];
  utilities.push({
    icon: shovel.itemData.icon,
    tool: shovel,
    onClickFunction: onDestroyPlant
  });

  utilities.push({
    icon: "plantAll",
    onClickFunction: onPlantAll
  });

  utilities.push({
    icon: "harvestAll",
    onClickFunction: onHarvestAll
  });

  utilities.push({
    icon: "pickupAll",
    onClickFunction: onPickupAll
  });

  return utilities;
};
