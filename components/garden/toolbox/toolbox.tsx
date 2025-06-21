import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import Toolbox from "@/models/itemStore/toolbox/tool/Toolbox";
import ToolButton from "./toolButton";



const ToolboxComponent = ({toolbox, onToolClickFunction, maxHeightPercentage}: {toolbox: Toolbox, onToolClickFunction: (arg: any) => void, maxHeightPercentage: number}) => {
	const {selectedItem, owner} = useSelectedItem();

	const getToolList = () => {
		return toolbox.getAllTools();
	}

	const RenderToolbox = () => {
		if (getToolList().length === 0) {
			return <div>{`This seems to be empty...`}</div>
		}
		return getToolList().map((tool, toolIndex) => {
			//Do not display items with 0 quantity
			return (
				<span key={toolIndex} className={`inline-flex`}>
					<ToolButton tool={tool} onClickFunction={onToolClickFunction} focus={tool == selectedItem}></ToolButton>
				</span>
			)
	})
	}

	return (<>
		<div className={`max-h-[${maxHeightPercentage}vh] overflow-y-auto`}>
		{RenderToolbox()}
		</div>
		</>
	);
}

export default ToolboxComponent;