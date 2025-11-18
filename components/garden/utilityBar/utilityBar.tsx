import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import { Tool } from "@/models/items/tools/Tool";
import UtilityButton from "./utilityButton";

export interface Utility {
	id: string;
	label: string;
	icon: string;
	tool?: Tool;
	onClickFunction: () => void;
  }

const UtilityBarComponent = ({utilities, maxHeightPercentage}: {utilities: Utility[], maxHeightPercentage: number}) => {
	const {selectedItem, owner} = useSelectedItem();

	const RenderUtilityBar = () => {
		return utilities.map((util, utilIndex) => {
			return (
				<span key={utilIndex} className={`inline-flex`}>
					<UtilityButton utility={util} onClickFunction={util.onClickFunction} focus={util.tool ? util.tool == selectedItem : false}></UtilityButton>
				</span>
			)
	})
	}

	if (utilities.length === 0) {
		return <div>{`This seems to be empty...`}</div>
	}

	return (<>
		<div className={`max-h-[${maxHeightPercentage}vh] overflow-y-auto`}>
		{RenderUtilityBar()}
		</div>
		</>
	);
}

export default UtilityBarComponent;