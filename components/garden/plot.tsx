import { Plot } from "@/models/garden/Plot";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useGarden } from "@/app/hooks/contexts/GardenContext";
import { Plant } from "@/models/items/placedItems/Plant";
import PlotTooltip from "./plotTooltip";
import colors from "../colors/colors";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { syncAllAccountObjects } from "@/app/garden/gardenFunctions";
import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { setAllLevelSystemValues, setCurrentExp, setExpToLevelUp, setUserLevel } from "@/store/slices/userLevelSystemSlice";
import { useDispatch } from "react-redux";
import IconButton from "../user/icon/IconButton";
import IconSVGButton from "../user/icon/IconSVGButton";
import { ConfirmDeletePlantPopupWindow } from "./confirmDeletePlantPopupWindow";
import { PlotActionType } from "@/app/hooks/garden/plotActions";

type PlotComponentProps = {
	plot: Plot;
	onPlotClickHelpers: {uiHelper: () => {success: boolean, displayIcon: string}, apiHelper: () => Promise<{success: boolean, displayIcon: string}>, actionType?: PlotActionType}
	currentTime: number;
  };

export interface PlotComponentRef {
	plot: Plot;
	click: () => void;
	currentTime: number;
	refresh: () => void;
}

const PlotComponent = forwardRef<PlotComponentRef, PlotComponentProps>(({plot, onPlotClickHelpers, currentTime}, ref) => {
	PlotComponent.displayName = "Plot";
	const [displayIcon, setDisplayIcon] = useState(plot.getItem().itemData.icon);
	const [forceRefreshKey, setForceRefreshKey] = useState(0);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const { account, guestMode, displayEmojiIcons, confirmDeletePlants } = useAccount();
	const { user, reloadUser } = useUser();
	const { garden, reloadGarden } = useGarden();
	const { inventory, reloadInventory } = useInventory();
	const dispatch = useDispatch();

	const getColor = () => {
		if (plot.getItemSubtype() === ItemSubtypes.GROUND.name) {
			return {
				bgColor: colors.ground.plotBackgroundColor,
				borderColor: `border-2 ${colors.ground.defaultBorderColor}`
			};
		} else if (plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
			const plant = plot.getItem() as Plant;
			const timeElapsed = Date.now() - plot.getPlantTime();
			const growTime = plot.getTotalGrowTime();
			// const growTime = plant.itemData.growTime;
			if (growTime * 1000 <= timeElapsed) {
				return {
					bgColor: 'bg-apple-500',
					borderColor: `border-2 ${colors.plant.grownBorderColor}`
				};
			} else if (growTime * 3/4 * 1000 <= timeElapsed) {
				return {
					bgColor: 'bg-apple-400',
					borderColor: `border-2 ${colors.plant.defaultBorderColor}`
				};
			} else if (growTime/2 * 1000 <= timeElapsed) {
				return {
					bgColor: 'bg-apple-300',
					borderColor: `border-2 ${colors.plant.defaultBorderColor}`
				};
			} else if (growTime * 1/4 * 1000 <= timeElapsed) {
				return {
					bgColor: 'bg-apple-200',
					borderColor: `border-2 ${colors.plant.defaultBorderColor}`
				};
			} else {
				return {
					bgColor: 'bg-apple-100',
					borderColor: `border-2 ${colors.plant.defaultBorderColor}`
				};
			}

		} else if (plot.getItemSubtype() === ItemSubtypes.DECORATION.name) {
			return {
				bgColor: colors.decoration.plotBackgroundColor,
				borderColor: `border-2 ${colors.decoration.defaultBorderColor}`
			};
		} else {
			//should never occur
			return {
				bgColor: 'bg-gray-300',
				borderColor: `border-2 ${colors.plant.defaultBorderColor}`
			};
		}
	}

	const [color, setColor] = useState(() => getColor());

	useImperativeHandle(ref, () => ({
		click() {
			handleClick();
		},
		plot,
		currentTime,
		refresh() {
			// This method can be called to refresh the component
			setForceRefreshKey((prevKey) => prevKey + 1); // Increment the key to force a re-render
			setDisplayIcon(plot.getItem().itemData.icon);
		}
	}));

	// Update color when plot data changes
	useEffect(() => {
		setColor(getColor());
	}, [plot.getItem().itemData.icon, plot.getPlantTime(), plot.getItemSubtype()]);

	// Set up interval for plant growth visualization
	useEffect(() => {
		if (plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
			const interval = setInterval(() => {
				setColor(getColor());
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [plot.getItemSubtype()]);

	const handleClick = async () => {
		// Check if this is a destroy action - if so, show popup instead of executing
		if (onPlotClickHelpers.actionType === PlotActionType.DESTROY_ITEM && confirmDeletePlants) {
			setShowDeletePopup(true);
			return;
		}

		//onPlotClick comes from plotActions which may/may not be async
		const uiResult = onPlotClickHelpers.uiHelper();
		if (uiResult.success) {
			setDisplayIcon(uiResult.displayIcon);
		} else {
			//no changes, don't need to do anything here (?)
			return;
		}
		
		// Call api if not in guest mode
		if (!guestMode) {
			const apiResult = await onPlotClickHelpers.apiHelper();
			if (apiResult.success) {
				setDisplayIcon(apiResult.displayIcon);
			} else {
				console.warn(`Api call failed`);
				// setDisplayIcon(apiResult.displayIcon);
				// TODO: sync plot function?
				await syncAllAccountObjects(user, garden, inventory);
				reloadUser();
				reloadGarden();
				reloadInventory();
				setDisplayIcon(plot.getItem().itemData.icon);
				// setForceRefreshKey((forceRefreshKey) => forceRefreshKey + 1); //we force a refresh to clear statuses
			}
		}
		dispatch(setAllLevelSystemValues({ id: user.getLevelSystem().getLevelSystemId(), level: user.getLevelSystem().getLevel(), currentExp: user.getLevelSystem().getCurrentExp(), expToLevelUp: user.getLevelSystem().getExpToLevelUp() }));
	}

	const handleDeletePlant = async () => {
		// Confirm that the action type is correct before proceeding
		if (onPlotClickHelpers.actionType !== PlotActionType.DESTROY_ITEM) {
			console.error(`Error: handleDeletePlant called with incorrect action type. Expected: ${PlotActionType.DESTROY_ITEM}, Got: ${onPlotClickHelpers.actionType}`);
			return;
		}

		// Execute the actual destroy logic from onPlotClickHelpers
		const uiResult = onPlotClickHelpers.uiHelper();
		if (uiResult.success) {
			setDisplayIcon(uiResult.displayIcon);
		} else {
			console.warn("UI helper failed for delete action");
			return;
		}
		
		// Call api if not in guest mode
		if (!guestMode) {
			const apiResult = await onPlotClickHelpers.apiHelper();
			if (apiResult.success) {
				setDisplayIcon(apiResult.displayIcon);
			} else {
				console.warn(`Api call failed for delete action`);
				// setDisplayIcon(apiResult.displayIcon);
				// TODO: sync plot function?
				await syncAllAccountObjects(user, garden, inventory);
				reloadUser();
				reloadGarden();
				reloadInventory();
				setDisplayIcon(plot.getItem().itemData.icon);
				// setForceRefreshKey((forceRefreshKey) => forceRefreshKey + 1); //we force a refresh to clear statuses
			}
		}
		dispatch(setAllLevelSystemValues({ id: user.getLevelSystem().getLevelSystemId(), level: user.getLevelSystem().getLevel(), currentExp: user.getLevelSystem().getCurrentExp(), expToLevelUp: user.getLevelSystem().getExpToLevelUp() }));
	};

	const getPlantName = () => {
		if (plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
			return plot.getItem().itemData.name;
		}
		return "this plant";
	};

	return (
		<>
			<PlotTooltip plot={plot} currentTime={currentTime} key={forceRefreshKey}>
				<IconButton
				icon={displayIcon}
				onClickFunction={handleClick}
				bgColor={color.bgColor}
				borderColor={color.borderColor}
				textSize="text-5xl"
				elementSize="16"/>
			</PlotTooltip>
			<ConfirmDeletePlantPopupWindow
				showWindow={showDeletePopup}
				setShowWindow={setShowDeletePopup}
				plantName={getPlantName()}
				onConfirmDelete={handleDeletePlant}
			/>
		</>
	);
});

export default PlotComponent;
