import { Inventory } from "@/models/itemStore/inventory/Inventory";
import InventoryItemComponent from "./inventoryItem";

const InventoryComponent = ({inventory, onInventoryItemClickFunction, costMultiplier}: {inventory: Inventory, onInventoryItemClickFunction: (arg: any) => void, costMultiplier: number}) => {

	return (
		<>
		<div className="w-[80%]">
			<div>{inventory.getUserId()}'s Inventory</div>
			<div>Gold: {inventory.getGold()}</div>
			{inventory.getAllItems().map((item, itemIndex) => (
				<div key={itemIndex}>
					<InventoryItemComponent item={item} onClickFunction={onInventoryItemClickFunction} costMultiplier={costMultiplier}></InventoryItemComponent>
				</div>
			))}
		</div>
		</>
	);
}

export default InventoryComponent;