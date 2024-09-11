import { useUser } from "@/app/hooks/contexts/UserContext";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { DecorationHistory } from "@/models/user/history/itemHistory/DecorationHistory";
import { PlantHistory } from "@/models/user/history/itemHistory/PlantHistory";

const ItemHistoryListComponent = ({}) => {
	//TODO: ItemHistoryComponent that looks more like square bubbles with information about each plant, ie almanac
	const { user } = useUser();
	const RenderItemHistories = () => {
		const histories = user.getItemHistory().getAllHistories();
		return (<>
			<div>
			{histories.map((history, index) => {
				if (history.getItemData().subtype === ItemSubtypes.PLANT.name) {
					const plantHistory = history as PlantHistory;
					return (
						<div key={plantHistory.getItemData().name}>
							{plantHistory.getItemData().name} {plantHistory.getItemData().icon}: {plantHistory.getHarvestedQuantity()}
						</div>
					);
				} else if (history.getItemData().subtype === ItemSubtypes.DECORATION.name) {
					const decorationHistory = history as DecorationHistory;
					return (
						<div key={decorationHistory.getItemData().name}>
							{decorationHistory.getItemData().name}: {decorationHistory.getPlacedQuantity()}
						</div>
					);
				} else {
					return (
						<></>
					);
				}
			})}
			</div>
		</>);

	}

	return <>
		{RenderItemHistories()}
	</>
}

export default ItemHistoryListComponent;