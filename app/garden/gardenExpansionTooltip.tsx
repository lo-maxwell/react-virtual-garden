import Tooltip, { ForceVisibleMode } from "@/components/window/tooltip";
import { useGarden } from "@/app/hooks/contexts/GardenContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { Garden } from "@/models/garden/Garden";
import React, { useCallback, useMemo } from "react";

const GardenExpansionTooltip = ({ children, row, expand }: { children: React.ReactNode, row: boolean, expand: boolean}) => {

	const { garden, gardenMessage, setGardenMessage, instantGrow, toggleInstantGrow } = useGarden();
	const { user } = useUser();


	const requiredLevel = useMemo(() => {
		return (Math.floor(user.getLevel()/5) + 1) * 5;
	}, [user]);

	const visible = useMemo((): ForceVisibleMode => {
		if (row && expand) {
			return Garden.canAddRow(garden.getRows(), user.getLevel()) ? "OFF" : "DEFAULT";
		} else if (!row && expand) {
			return Garden.canAddColumn(garden.getCols(), user.getLevel()) ? "OFF" : "DEFAULT";
		} else if (row && !expand) { 
			return garden.getRows() >= 2 ? "OFF" : "DEFAULT";
		} else { //(!row && !expand)
			return garden.getCols() >= 2 ? "OFF" : "DEFAULT";
		}
	}, [row, expand, garden, user]);

	const tooltipContent = useMemo(() => {
		if (row && expand) {
			if (Garden.canAddRow(garden.getRows(), user.getLevel())) {
				return <></>;
			} else {
				return <div>{`Requires level ${requiredLevel}`}</div>;
			}
		} else if (!row && expand) {
			if (Garden.canAddColumn(garden.getCols(), user.getLevel())) {
				return <></>;
			} else {
				return <div>{`Requires level ${requiredLevel}`}</div>;
			}
		} else if (row && !expand) { 
			if (garden.getRows() >= 2) {
				return <></>;
			} else {
				return <div>{`Cannot shrink garden further`}</div>;
			}
		} else { //(!row && !expand)
			if (garden.getCols() >= 2) {
				return <></>;
			} else {
				return <div>{`Cannot shrink garden further`}</div>;
			}
		}
	}, [row, expand, garden, user, requiredLevel]);

	// Memoize the tooltip component props
	const tooltipProps = useMemo(() => ({
		content: tooltipContent,
		position: "top" as const,
		backgroundColor: "bg-gray-300 border-2 border-coffee-600",
		forceVisible: visible,
		boxWidth: "300px"
	}), [tooltipContent, visible]);

	return (
		<div className="w-fit">
			<Tooltip {...tooltipProps}>
				{children}
			</Tooltip>
		</div>
	);
}

export default GardenExpansionTooltip;