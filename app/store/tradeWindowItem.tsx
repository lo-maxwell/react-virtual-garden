import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";

const TradeWindowItemComponent  = ({item, quantity, costMultiplier}: {item: InventoryItem, quantity: number, costMultiplier: number}) => {
	// const handleClick = () => {
	// 	onClickFunction(item);
	// }

	const renderItemComponent = ({icon, name, quantity, price}: {icon: string, name: string, quantity: number, price: number}) => {
		return (
			<>
				<span className="flex justify-end min-w-[35px]">
					{quantity}
				</span>
				<div className="mx-1 w-6">{icon}</div>
				<div className="flex pl-1 justify-start min-w-0 max-w-[75%] flex-grow">
					{/* Might not display properly if screen size is small or name is too long */}
					<span className="flex items-left truncate min-w-0 max-w-[100%]">{name}</span>
				</div>
				<span className="flex min-w-[30px] justify-start">
					<span className="mr-1">💰</span> {/* Gold icon */}
					{price}
				</span>
			</>
		);
	}

	return (
		<>
		<button className="flex justify-between bg-gray-300 px-2 py-1 my-0.5 w-[100%] text-sm text-purple-600 font-semibold border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">
			{renderItemComponent({icon: item.itemData.icon, name: item.itemData.name, quantity: quantity, price: quantity * item.itemData.value * costMultiplier})}
		</button>
		</>
	);
}

export default TradeWindowItemComponent;