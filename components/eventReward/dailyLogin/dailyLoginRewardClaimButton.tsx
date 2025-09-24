import { useUser } from "@/app/hooks/contexts/UserContext";
import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import ItemStoreComponent from "@/components/itemStore/itemStore";
import IconButton from "@/components/user/icon/IconButton";
import { PopupWindow } from "@/components/window/popupWindow";
import { DailyLoginRewardFactory } from "@/models/events/dailyLogin/DailyLoginRewardFactory";
import { EventReward } from "@/models/events/EventReward";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";
import { useEffect, useState } from "react";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { makeApiRequest } from "@/utils/api/api";
import { handleDailyLoginApiResponse} from "./dailyLoginRewardClaimFunctions";
import { saveInventory } from "@/utils/localStorage/inventory";
import { saveUser } from "@/utils/localStorage/user";
import DailyLoginRewardClaimTooltip from "./dailyLoginRewardClaimTooltip";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";


const DailyLoginRewardClaimButton = () => {
    const { guestMode } = useAccount();
    const [showWindow, setShowWindow] = useState(false);
    const [dailyLoginEvent, setDailyLoginEvent] = useState<UserEvent | null>(null);
    const [eventReward, setEventReward] = useState<EventReward | null>(null);
    const [previousEventReward, setPreviousEventReward] = useState<EventReward | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showClaimedRewardScreen, setShowClaimedRewardScreen] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const {user, reloadUser} = useUser();
    const { selectedItem, toggleSelectedItem } = useSelectedItem();
    const {inventory, reloadInventory, updateInventoryForceRefreshKey} = useInventory();
    
    const showWindowHandler = () => {
        setShowWindow(true);
        setShowClaimedRewardScreen(false);
        fetchDailyLoginEvent();
    }

    const fetchDailyLoginEvent = async () => {
        if (guestMode || !user) {
            setPreviousEventReward(null);
            return;
        }
        setIsLoading(true);
        setApiError(null);
        try {
            const apiRoute = `/api/user/${user.getUserId()}/events/dailyLogin`;
            const apiResponse = await makeApiRequest('GET', apiRoute, {}, true);

            if (!apiResponse.success) {
                setApiError(apiResponse.error?.message || 'Failed to fetch previous daily login reward. Please try again later.');
                setPreviousEventReward(null);
                return;
            }
            const userEvent = UserEvent.fromPlainObject(apiResponse.data);
            setPreviousEventReward(userEvent.getEventReward());
        } catch (error) {
            console.error('Error fetching previous daily login reward:', error);
            setApiError('Failed to fetch previous daily login reward. Please try again later.');
            setPreviousEventReward(null);
        } finally {
            setIsLoading(false);
        }
    };

    const closeWindowAndRefresh = (val: boolean) => {
        setShowWindow(val);
        reloadUser();
        reloadInventory();
        toggleSelectedItem(null);
    }

    
    const canClaim = process.env.NEXT_PUBLIC_DAILY_LOGIN_OVERRIDE === 'true' ? true : (guestMode ? false : (dailyLoginEvent ? DailyLoginRewardFactory.canClaimReward(new Date(Date.now()), dailyLoginEvent) : true));

    const claimDailyLoginReward = async () => {
        toggleSelectedItem(null);
        
        setApiError(null); // Clear any previous API errors
        setIsLoading(true);
        try {
            const apiRoute = `/api/user/${user.getUserId()}/events/dailyLogin`;
            const data = { inventoryId: inventory.getInventoryId() };
            const apiResponse = await makeApiRequest('PATCH', apiRoute, data, true);
            
            if (!apiResponse.success) {
                setApiError(apiResponse.error?.message || 'Failed to fetch daily login reward. Please try again later.');
                setEventReward(null);
                return;
            }

            const userEvent = handleDailyLoginApiResponse(user, inventory, apiResponse.data);

            const reward = userEvent.getEventReward();
            setEventReward(reward);
            setShowClaimedRewardScreen(true);
            
            // Update the daily login event state
            const updatedEvent = user.getEvent(UserEventTypes.DAILY.name);
            setDailyLoginEvent(updatedEvent || null);
            
            saveUser(user);
            saveInventory(inventory);
            console.log('finished claiming daily login reward');
            console.log(reward);
        } catch (error) {
            console.error('Error fetching daily login reward:', error);
            // If there's an error, show "already claimed" message
            setEventReward(null);
            setApiError('Failed to fetch daily login reward. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const dailyLoginEvent = user.getEvent(UserEventTypes.DAILY.name);
		setDailyLoginEvent(dailyLoginEvent || null);
        fetchDailyLoginEvent();

        const now = new Date();
        // Calculate the next midnight UTC-7 (which is 7 AM UTC).
        const nextMidnightUtcMinus7 = new Date();
        nextMidnightUtcMinus7.setUTCHours(7, 0, 0, 0);

        // If current UTC time is already past 7 AM UTC, then the next midnight UTC-7 is tomorrow.
        if (now.getTime() > nextMidnightUtcMinus7.getTime()) {
            nextMidnightUtcMinus7.setUTCDate(nextMidnightUtcMinus7.getUTCDate() + 1);
        }

        const timeToMidnight = nextMidnightUtcMinus7.getTime() - now.getTime();

        const timeoutId = setTimeout(() => {
            // Force a reload of user data, which will re-evaluate canClaim
            reloadUser();
            fetchDailyLoginEvent();
            // Optionally, you might want to call reloadInventory() too if daily login affects inventory immediately
            // reloadInventory();
        }, timeToMidnight);

        return () => clearTimeout(timeoutId);
	}, [user, reloadUser]);

    function renderItemRewards(reward: EventReward | null = null) {
        const rewardToRender = reward || eventReward;
        if (!rewardToRender) return null;
        const items = rewardToRender.getItems();
        const tempInventory = new Inventory("temp", "temp", 0, items);
        return (
            <ItemStoreComponent itemStore={tempInventory} onInventoryItemClickFunction={() => {}} costMultiplier={1} maxHeightPercentage={100} displayFilter={false} initialSubtypeFilter={null} initialCategoryFilter={null}/>
        )
    }

    function renderPopupWindowDisplay() {
        const now = new Date();
        const nextMidnightUtcMinus7 = new Date();
        nextMidnightUtcMinus7.setUTCHours(7, 0, 0, 0);

        if (now.getTime() > nextMidnightUtcMinus7.getTime()) {
            nextMidnightUtcMinus7.setUTCDate(nextMidnightUtcMinus7.getUTCDate() + 1);
        }

        const timeToMidnight = nextMidnightUtcMinus7.getTime() - now.getTime();
        const hours = Math.floor(timeToMidnight / (1000 * 60 * 60));
        const minutes = Math.floor((timeToMidnight % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeToMidnight % (1000 * 60)) / 1000);

        const timeUntilNextClaim = `${hours}h ${minutes}m`;
        return <> { isLoading ? (
                <div className="text-xl mb-2">Calculating daily login reward...</div>
            ) : apiError ? (
                <>
                <div className="text-xl mb-2 text-red-500">{apiError}</div>
                <button
                className="mx-auto mt-4 block 
                            border-2 border-gray-400 
                            bg-gray-200 
                            text-gray-700 font-medium 
                            px-6 py-3 rounded-lg 
                            hover:bg-gray-300 hover:text-gray-900 
                            transition"
                onClick={() => closeWindowAndRefresh(false)}
                >
                Exit
                </button>
                </>
            ) : showClaimedRewardScreen ? (
                <>
                <div className="text-xl">{`Day: ${eventReward!.getStreak()}`}</div>
                {eventReward!.getStreak() % 7 == 0 ? (
                    <div className="text-xl">{`7-Day Streak Bonus!`}</div> )
                    : <></>
                }
                <div className="text-2xl my-2">You Recieved: </div>
                <div className="text-xl mb-2">{eventReward!.getGold()} gold</div>
                {renderItemRewards()}
                <button
                className="mx-auto mt-4 block 
                            border-4 border-yellow-500 
                            bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 
                            text-white font-bold drop-shadow-md 
                            px-6 py-3 rounded-xl 
                            hover:from-yellow-500 hover:to-orange-500 
                            hover:scale-105 transition"
                onClick={() => {
                    setEventReward(null);
                    setShowClaimedRewardScreen(false);
                    if (process.env.NEXT_PUBLIC_DAILY_LOGIN_OVERRIDE === 'true') {
                        // In override mode, immediately re-fetch the previous event to update canClaim
                        fetchDailyLoginEvent();
                    }
                    setShowWindow(false);
                }}
                > Awesome! </button>
                </>
            ) : canClaim ? (
                <>
                    <div className="text-xl mb-2">Claim your daily login reward!</div>
                    {dailyLoginEvent && (
                        <div className="text-lg mb-2">
                            Current Streak: {dailyLoginEvent.getStreak()} days
                        </div>
                    )}
                    {(dailyLoginEvent ? dailyLoginEvent.getStreak() + 1 : 1) % 7 === 0 && (
                        <div className="text-xl mb-4 text-yellow-600 font-bold">Next reward is a Weekly Bonus!</div>
                    )}
                    <button
                        className="mx-auto mt-4 block 
                            border-4 border-yellow-500 
                            bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 
                            text-white font-bold drop-shadow-md 
                            px-6 py-3 rounded-xl 
                            hover:from-yellow-500 hover:to-orange-500 
                            hover:scale-105 transition"
                        onClick={claimDailyLoginReward}
                        disabled={isLoading}
                    >
                        Claim Reward
                    </button>
                </>
            ) : (
                <>
                <div className="text-xl mb-2">Daily login reward already claimed today.</div>
                <div className="text-lg mb-2">Next claim in: {timeUntilNextClaim}</div>
                {previousEventReward && (
                    <>
                        <div className="text-2xl my-2">Previous Reward: </div>
                        <div className="text-xl mb-2">{previousEventReward.getGold()} gold</div>
                        {renderItemRewards(previousEventReward)}
                    </>
                )}
                <button
                className="mx-auto mt-4 block 
                            border-2 border-gray-400 
                            bg-gray-200 
                            text-gray-700 font-medium 
                            px-6 py-3 rounded-lg 
                            hover:bg-gray-300 hover:text-gray-900 
                            transition"
                onClick={() => closeWindowAndRefresh(false)}
                >
                Exit
                </button>
                </>
            )}
        </>
    }
    
    return (
		<>
            <DailyLoginRewardClaimTooltip>
        	    <IconButton icon={"reward"} onClickFunction={showWindowHandler} bgColor={canClaim ? `bg-blue-300` : `bg-gray-400`} borderColor={`border border-2 border-coffee-700`} textSize={"text-4xl"} elementSize={"12"} />
            </DailyLoginRewardClaimTooltip>
            <PopupWindow showWindow={showWindow} setShowWindow={() => {}}> 
                <div className="w-max bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
                    <div className="text-2xl mb-2 text-black">{`Daily Login Bonus`}</div>
                    {renderPopupWindowDisplay()}
                    </div>
            </PopupWindow>
			</>
    );
}

export default DailyLoginRewardClaimButton;
