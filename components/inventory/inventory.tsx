import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import ItemStoreComponent from "../itemStore/itemStore";

const InventoryComponent = ({onInventoryItemClickFunction, costMultiplier, forceRefreshKey}: {onInventoryItemClickFunction: (arg: any) => void, costMultiplier: number, forceRefreshKey: number}) => {
	const { inventory } = useInventory();
	const { user } = useUser();
	const gold = useSelector((state: RootState) => state.inventory.gold);
	
	return (
		<>
		<div className="text-black w-full" key={forceRefreshKey}>
			{/* TODO: Replace with inventory.getOwnerName() and update owner name whenever username changes */}
			<div>{user.getUsername()}{"'s Inventory"}</div>
			<div data-testid="current-gold">💰 {gold}</div>
			<ItemStoreComponent itemStore={inventory} onInventoryItemClickFunction={onInventoryItemClickFunction} costMultiplier={costMultiplier} maxHeightPercentage={60} displayFilter={true} initialSubtypeFilter={null} initialCategoryFilter={null}/>
		</div>
		</>
	);
}

export default InventoryComponent;