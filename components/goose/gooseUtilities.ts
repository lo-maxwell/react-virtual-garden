import { Utility } from "@/components/garden/utilityBar/utilityBar";

export const buildGooseUtilities = (
  {
    onFeedGoose,
    onSellGoose
  }: {
	  onFeedGoose: () => void;
    onSellGoose: () => void;
  }
): Utility[] => {
  const utilities: Utility[] = [];

  utilities.push({
    icon: "feedGoose",
    onClickFunction: onFeedGoose
  });

  utilities.push({
    icon: "sellGoose",
    onClickFunction: onSellGoose
  });

  return utilities;
};
