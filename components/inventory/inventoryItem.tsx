import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";

const InventoryItemComponent = ({item, setSelected}: {item: InventoryItem, setSelected: Function}) => {
	const handleClick = () => {
		setSelected(item);
	}

	return (
		<>
		<button onClick={handleClick} className="bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">
			{`${item.itemData.icon} ${item.itemData.name}, ${item.getQuantity()}`}
		</button>
		</>
	);
}

export default InventoryItemComponent;