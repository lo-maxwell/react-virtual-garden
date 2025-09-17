import { useUser } from "@/app/hooks/contexts/UserContext";
import { EventReward } from "@/models/events/EventReward";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { useState } from "react";
import ItemStoreComponent from "../itemStore/itemStore";
import IconButton from "../user/icon/IconButton";
import { PopupWindow } from "../window/popupWindow";


const EventRewardPopupWindow = ({ eventReward }: {eventReward: EventReward}) => {
    const [showWindow, setShowWindow] = useState(false);
    const showWindowHandler = () => {
        setShowWindow(true);
    }

    function renderItemRewards() {
        const items = eventReward.getItems();
        const tempInventory = new Inventory("temp", "temp", 0, items);
        // TODO: Update itemstorecomponent so it can take in an inventoryitemlist instead of this
        return (
            <ItemStoreComponent itemStore={tempInventory} onInventoryItemClickFunction={() => {}} costMultiplier={0} maxHeightPercentage={100} displayFilter={false} initialSubtypeFilter={null} initialCategoryFilter={null}/>
        )
    }
    
	return (
        <span>
            <IconButton icon={"reward"} onClickFunction={showWindowHandler} bgColor={`bg-blue-300`} borderColor={`border border-2 border-coffee-700`} textSize={"text-4xl"} elementSize={"12"}/>
            <PopupWindow showWindow={showWindow} setShowWindow={setShowWindow}>
                <div className="w-max bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
                    <div className="text-2xl text-semibold"> Event Rewards: </div>
                    <div className="text-xl mb-2">{eventReward.getEventType()}</div>
                    <div className="text-xl mb-2">{eventReward.getGold()} gold</div>
                    {renderItemRewards()}
                    </div>
            </PopupWindow>
        </span>
    );
}

export default EventRewardPopupWindow;