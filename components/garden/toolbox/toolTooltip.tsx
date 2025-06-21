import colors from "@/components/colors/colors";
import Tooltip from "@/components/window/tooltip";
import Shovel from "@/models/items/tools/Shovel";
import { Tool } from "@/models/items/tools/Tool";

const ToolTooltip = ({ children, tool }: { children: React.ReactNode, tool: Tool}) => {

	const RenderItemTooltipInfo = () => {
		switch(tool.itemData.type) {
			case "Shovel":
				return RenderShovelTooltip();
			default:
				return RenderEmptyItemTooltip();
		}
	}

	//Can pull this out to a separate file if we ever need multiple formats for tooltips
	const RenderShovelTooltip = () => {
		const currentTool = tool as Shovel;

		return <>
		<div className="flex flex-col items-left min-w-0 flex-grow">
			<div className="flex flex-row justify-between min-w-max">
				<div className="flex flex-row min-w-0">
					<span className="w-6 flex-shrink-0">{currentTool.itemData.icon}</span>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{currentTool.itemData.name}</span>
				</div>
			</div>
			<div className={`${colors.tool.descriptionTextColor} text-left`}>
				{/* {currentTool.description} */}
				{`This isn't implemented yet!`}
			</div>
		</div>
	</>
	}

	const RenderEmptyItemTooltip = () => {
		return <>There was an error!</>;
	}

	const getBackgroundColor = () => {
		switch(tool.itemData.type) {
			case "Shovel":
				return "bg-gray-300"
			default:
				return "bg-gray-300";
		}
	}

	// const showTooltip = plot.getItemSubtype() === ItemSubtypes.GROUND.name ? 'OFF' : 'ON';

	return (
		<div>
			<Tooltip content={RenderItemTooltipInfo()} position="top" backgroundColor={getBackgroundColor()} forceVisible={""} boxWidth={'20vw'}>
				{children}
			</Tooltip>
		</div>
		);
}

export default ToolTooltip;