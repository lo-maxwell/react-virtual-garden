"use client";
import colors from "@/components/colors/colors";
import InventoryItemTooltip from "@/components/inventory/inventoryItemTooltip";
import ItemComponent from "@/components/inventory/item";
import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import { ItemSubtypes } from "@/models/items/ItemTypes";

const TradeWindowItemComponent  = ({item, quantity, costMultiplier}: {item: InventoryItem, quantity: number, costMultiplier: number}) => {

	const {owner} = useSelectedItem();
	const getPriceColor = () => {
		if (owner instanceof Store) {
			if (costMultiplier > 2) {
				return colors.store.storeHighPrice;
			} else if (costMultiplier == 2) {
				return colors.store.storeRegularPrice;
			} else if (costMultiplier < 2) {
				return colors.store.storeLowPrice;
			}
			return '';
		} else if (owner instanceof Inventory){
			//itemStore instanceof Inventory
			if (costMultiplier > 1) {
				return colors.inventory.inventoryHighPrice;
			} else if (costMultiplier == 1) {
				return colors.inventory.inventoryRegularPrice;
			} else if (costMultiplier < 1) {
				return colors.inventory.inventoryLowPrice;
			}
			return '';
		} else {
			return '';
		}
	}

	const getBackgroundColor = () => {
		switch(item.itemData.subtype) {
			case ItemSubtypes.BLUEPRINT.name:
				return colors.blueprint.inventoryBackgroundColor;
			case ItemSubtypes.SEED.name:
				return colors.seed.inventoryBackgroundColor;
			case ItemSubtypes.HARVESTED.name:
				return colors.harvested.inventoryBackgroundColor;
			default:
				return `bg-reno-sand-400`; // Default background color for other types
		}
	}

	const getClassName = () => {
		return `text-coffee-800 ${getBackgroundColor()} flex justify-between px-2 py-1 my-0.5 w-[100%] text-sm font-semibold border border-purple-200 ${colors.inventory.inventoryHoverTextColor} ${colors.inventory.inventoryHoverBackgroundColor}`;
	}

	const getPrice = () => {
		return quantity * item.itemData.value * costMultiplier;
	}

	return (
		<>
		<InventoryItemTooltip item={item}>
			<button className={getClassName()}>
				<ItemComponent icon={item.itemData.icon} name={item.itemData.name} quantity={quantity} price={getPrice()} priceColor={getPriceColor()} width={null}/>
			</button>
		</InventoryItemTooltip>
		</>
	);
}

export default TradeWindowItemComponent;