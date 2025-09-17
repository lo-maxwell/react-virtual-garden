import Tooltip, { ForceVisibleMode } from "@/components/window/tooltip";
import { useGarden } from "@/app/hooks/contexts/GardenContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { Garden } from "@/models/garden/Garden";

const GardenExpansionTooltip = ({ children, row, expand }: { children: React.ReactNode, row: boolean, expand: boolean}) => {

	const { garden, gardenMessage, setGardenMessage, instantGrow, toggleInstantGrow } = useGarden();
	const { user } = useUser();
	let visible: ForceVisibleMode = "DEFAULT";

	
	const RenderTooltip = () => {
		if (row && expand) {
			if (Garden.canAddRow(garden.getRows(), user.getLevel())) {
				visible = "OFF";
				return <></>
			} else {
				const requiredLevel = (Math.floor(user.getLevel()/5) + 1) * 5;
				return <div>{`Requires level ${requiredLevel}`}</div>;
			}
		} else if (!row && expand) {
			if (Garden.canAddColumn(garden.getCols(), user.getLevel())) {
				visible = "OFF";
				return <></>
			} else {
				const requiredLevel = (Math.floor(user.getLevel()/5) + 1) * 5;
				return <div>{`Requires level ${requiredLevel}`}</div>;
			}
		} else if (row && !expand) { 
			if (garden.getRows() >= 2) {
				visible = "OFF";
				return <></>
			} else {
				return <div>{`Cannot shrink garden further`}</div>;
			}
		} else { //(!row && !expand)
			if (garden.getCols() >= 2) {
				visible = "OFF";
				return <></>
			} else {
				return <div>{`Cannot shrink garden further`}</div>;
			}
		} 
	}

	return (
		<div className="w-fit">
			<Tooltip content={RenderTooltip()} position="top" backgroundColor={`bg-gray-300 border-2 border-coffee-600`} forceVisible={visible} boxWidth={"300px"}>
				{children}
			</Tooltip>
		</div>
		);
}

export default GardenExpansionTooltip;