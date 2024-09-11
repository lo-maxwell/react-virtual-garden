import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import ItemStoreComponent from "../itemStore/itemStore";

const InventoryComponent = ({onInventoryItemClickFunction, costMultiplier}: {onInventoryItemClickFunction: (arg: any) => void, costMultiplier: number}) => {
	const { inventory } = useInventory();
	const { user } = useUser();
	
	return (
		<>
		<div className="text-black w-full">
			{/* TODO: Replace with inventory.getOwnerName() and update owner name whenever username changes */}
			<div>{user.getUsername()}{"'s Inventory"}</div>
			<div data-testid="current-gold">Gold: {inventory.getGold()}</div>
			<ItemStoreComponent itemStore={inventory} onInventoryItemClickFunction={onInventoryItemClickFunction} costMultiplier={costMultiplier} maxHeightPercentage={60}/>
		</div>
		</>
	);
}

export default InventoryComponent;