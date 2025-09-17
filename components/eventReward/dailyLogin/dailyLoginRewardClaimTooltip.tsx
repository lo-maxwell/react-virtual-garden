import Tooltip from "@/components/window/tooltip";
import { EventReward } from "@/models/events/EventReward";
import { DailyLoginRewardFactory } from "@/models/events/dailyLogin/DailyLoginRewardFactory";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { useEffect, useState } from "react";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { useAccount } from "@/app/hooks/contexts/AccountContext";

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const DailyLoginRewardClaimTooltip = ({ children }: { children: React.ReactNode}) => {
	const { guestMode } = useAccount();
    const {user} = useUser();
    const [dailyLoginEvent, setDailyLoginEvent] = useState<UserEvent | null>(null);
    const [hoverRefreshKey, setHoverRefreshKey] = useState(0);

    useEffect(() => {
        const dailyLoginEvent = user.getEvent(UserEventTypes.DAILY.name);
		setDailyLoginEvent(dailyLoginEvent || null);
	}, [user]);

    const canClaim = dailyLoginEvent ? DailyLoginRewardFactory.canClaimReward(new Date(Date.now()), dailyLoginEvent) : true;
    const timeUntilNextClaim = DailyLoginRewardFactory.getDefaultTimeBetweenRewards();

    const buttonText = guestMode ? `This feature is not available in guest mode.` : (canClaim ? "Claim Daily Login" : `Daily Login claimed today, next available in ${formatTime(timeUntilNextClaim)}`);

	const RenderItemTooltipInfo = () => {
		return <div className={`text-xl text-black`}>{buttonText}</div>;
	};

	const getBackgroundColor = () => {
		return "bg-gray-300";
		
	}

	return (
		<div className="w-full">
			<Tooltip content={<RenderItemTooltipInfo key={hoverRefreshKey} />} position="top" backgroundColor={getBackgroundColor()} boxWidth={"20vw"} onMouseEnter={() => setHoverRefreshKey(prev => prev + 1)}>
				{children}
			</Tooltip>
		</div>
		);
}

export default DailyLoginRewardClaimTooltip;