import ItemComponent from "@/components/inventory/item";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";

const TradeWindowItemComponent  = ({item, quantity, costMultiplier}: {item: InventoryItem, quantity: number, costMultiplier: number}) => {
	// const handleClick = () => {
	// 	onClickFunction(item);
	// }


	return (
		<>
		<button className="flex justify-between bg-gray-300 px-2 py-1 my-0.5 w-full text-sm text-purple-600 font-semibold border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">
			<ItemComponent icon={item.itemData.icon} name={item.itemData.name} quantity={quantity} price={quantity * item.itemData.basePrice * costMultiplier}/>
		</button>
		</>
	);
}

export default TradeWindowItemComponent;