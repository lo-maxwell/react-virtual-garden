import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { useEffect, useState } from "react";
import InventoryItemTooltip from "./inventoryItemTooltip";
import ItemComponent from "./item";

const InventoryItemComponent = ({item, onClickFunction, costMultiplier}: {item: InventoryItem, onClickFunction: (arg: any) => void, costMultiplier: number}) => {
	const itemQuantity = item.getQuantity();
	const [displayQuantity, setDisplayQuantity] = useState(itemQuantity);

	useEffect(() => {
		if (displayQuantity !== item.getQuantity()) {
		  setDisplayQuantity(item.getQuantity());
		}
	  }, [item, displayQuantity, item.getQuantity()]);
	
	const handleClick = () => {
		onClickFunction(item);
	}

	return (
		<>
		<InventoryItemTooltip item={item}>
			<button onClick={handleClick} className={`flex justify-between bg-reno-sand-400 px-4 py-1 my-0.5 w-full text-sm text-coffee-800 font-semibold border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>
				<ItemComponent icon={item.itemData.icon} name={item.itemData.name} quantity={displayQuantity} price={item.itemData.value * costMultiplier}/>
			</button>
		</InventoryItemTooltip>
		</>
	);
}

export default InventoryItemComponent;