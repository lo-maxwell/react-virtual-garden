import { useUser } from "@/app/hooks/contexts/UserContext";
import ActionHistoryListComponent from "./ActionHistoryList";
import ItemHistoryListComponent from "./ItemHistoryList";

const HistoryComponent = ({}) => {
	const {user} = useUser();
	return <>
		<div className={`text-xl`}>User Stats</div>
		<div>
			{`Daily Login Bonuses Claimed: ${user.getUserEvents().get("DAILYLOGIN") ? user.getUserEvents().get("DAILYLOGIN")?.getStreak() : 0}`}
		</div>
		<div>
			{`Total xp: ${user.getLevelSystem().getTotalExp()}`}
		</div>
		<div>
			{/* <ActionHistoryListComponent/> */}
		</div>
		<div>
			<ItemHistoryListComponent/>
		</div>
	</>
}

export default HistoryComponent;