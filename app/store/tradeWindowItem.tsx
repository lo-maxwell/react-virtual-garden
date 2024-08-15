import colors from "@/components/colors/colors";
import InventoryItemTooltip from "@/components/inventory/inventoryItemTooltip";
import ItemComponent from "@/components/inventory/item";
import { useSelectedItem } from "@/hooks/contexts/SelectedItemContext";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";

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

	const getPrice = () => {
		return quantity * item.itemData.value * costMultiplier;
	}

	return (
		<>
		<InventoryItemTooltip item={item}>
			<button className="flex justify-between bg-reno-sand-400 px-2 py-1 my-0.5 w-[100%] text-sm text-coffee-800 font-semibold border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">
				<ItemComponent icon={item.itemData.icon} name={item.itemData.name} quantity={quantity} price={getPrice()} priceColor={getPriceColor()} width={null}/>
			</button>
		</InventoryItemTooltip>
		</>
	);
}

export default TradeWindowItemComponent;