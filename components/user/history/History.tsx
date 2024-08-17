import ActionHistoryListComponent from "./ActionHistoryList";
import ItemHistoryListComponent from "./ItemHistoryList";

const HistoryComponent = ({}) => {

	return <>
		<div>
			This is the history component!
		</div>
		<div>
		<ActionHistoryListComponent/>
		</div>
		<div>
		<ItemHistoryListComponent/>
		</div>
	</>
}

export default HistoryComponent;