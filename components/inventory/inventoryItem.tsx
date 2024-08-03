import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import ItemComponent from "./item";

const InventoryItemComponent = ({item, onClickFunction, costMultiplier}: {item: InventoryItem, onClickFunction: (arg: any) => void, costMultiplier: number}) => {
	const handleClick = () => {
		onClickFunction(item);
	}

	return (
		<>
		<button onClick={handleClick} className="flex justify-between bg-reno-sand-400 px-4 py-1 my-0.5 w-full text-sm text-coffee-800 font-semibold border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">
			<ItemComponent icon={item.itemData.icon} name={item.itemData.name} quantity={item.getQuantity()} price={item.itemData.value * costMultiplier}/>
		</button>
		</>
	);
}

export default InventoryItemComponent;