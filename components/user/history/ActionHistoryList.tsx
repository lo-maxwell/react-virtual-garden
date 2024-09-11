import { useUser } from "@/app/hooks/contexts/UserContext";

const ActionHistoryListComponent = ({}) => {
	const { user } = useUser();
	const RenderActionHistories = () => {
		const histories = user.getActionHistory().getAllHistories();
		return (<>
			<div>
			{histories.map((history, index) => {
				return (
					<div key={history.getName()}>
						{history.getName()}: {history.getQuantity()}
					</div>
				);
			})}
			</div>
		</>);

	}

	return <>
		{RenderActionHistories()}
	</>
}

export default ActionHistoryListComponent;