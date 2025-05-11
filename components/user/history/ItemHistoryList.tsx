import { useUser } from "@/app/hooks/contexts/UserContext";
import { ItemSubtypes } from "@/models/items/ItemTypes";

const ItemHistoryListComponent = ({}) => {
	//TODO: ItemHistoryComponent that looks more like square bubbles with information about each plant, ie almanac
	const { user } = useUser();
	const RenderItemHistories = () => {
		const histories = user.getItemHistory().getAllHistories();
		return (<>
			<div>
			{histories.map((history, index) => {
				if (history.getItemData().subtype === ItemSubtypes.HARVESTED.name) {
					return (
						<div key={history.getItemData().name + index}>
							{history.getItemData().name} {history.getItemData().icon}: {history.getQuantity()}
						</div>
					);
				} else if (history.getItemData().subtype === ItemSubtypes.DECORATION.name) {
					return (
						<div key={history.getItemData().name + index}>
							{history.getItemData().name}: {history.getQuantity()}
						</div>
					);
				} else {
					return null;
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