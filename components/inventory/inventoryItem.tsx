import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import { useEffect, useState } from "react";
import colors from "../colors/colors";
import InventoryItemTooltip from "./inventoryItemTooltip";
import ItemComponent from "./item";

const InventoryItemComponent = ({itemStore, item, onClickFunction, costMultiplier}: {itemStore: Store | Inventory, item: InventoryItem, onClickFunction: (arg: any) => void, costMultiplier: number}) => {
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

	const getTextColor = () => {
		if (itemStore instanceof Store) {
			return colors.store.storeDefaultItemTextColor;
		} else {
			//itemStore instanceof Inventory
			return colors.inventory.inventoryDefaultItemTextColor;
		}
	}

	const getPriceColor = () => {
		if (itemStore instanceof Store) {
			if (costMultiplier > 2) {
				return colors.store.storeHighPrice;
			} else if (costMultiplier == 2) {
				return colors.store.storeRegularPrice;
			} else if (costMultiplier < 2) {
				return colors.store.storeLowPrice;
			}
			return '';
		} else {
			//itemStore instanceof Inventory
			if (costMultiplier > 1) {
				return colors.inventory.inventoryHighPrice;
			} else if (costMultiplier == 1) {
				return colors.inventory.inventoryRegularPrice;
			} else if (costMultiplier < 1) {
				return colors.inventory.inventoryLowPrice;
			}
			return '';
		}
	}

	return (
		<>
		<InventoryItemTooltip item={item}>
			<button onClick={handleClick} className={`${getTextColor()} flex justify-between bg-reno-sand-400 px-4 py-1 my-0.5 w-full text-sm font-semibold border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>
				<ItemComponent icon={item.itemData.icon} name={item.itemData.name} quantity={displayQuantity} price={item.itemData.value * costMultiplier} priceColor={getPriceColor()}/>
			</button>
		</InventoryItemTooltip>
		</>
	);
}

export default InventoryItemComponent;