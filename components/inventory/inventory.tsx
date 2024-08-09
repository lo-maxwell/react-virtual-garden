import { useInventory } from "@/hooks/contexts/InventoryContext";
import ItemStoreComponent from "../itemStore/itemStore";

const InventoryComponent = ({onInventoryItemClickFunction, costMultiplier}: {onInventoryItemClickFunction: (arg: any) => void, costMultiplier: number}) => {
	const { inventory } = useInventory();
	
	return (
		<>
		<div className="text-black">
			<div>{inventory.getUserId()}{"'s Inventory"}</div>
			<div>Gold: {inventory.getGold()}</div>
			<ItemStoreComponent itemStore={inventory} onInventoryItemClickFunction={onInventoryItemClickFunction} costMultiplier={costMultiplier}/>
		</div>
		</>
	);
}

export default InventoryComponent;