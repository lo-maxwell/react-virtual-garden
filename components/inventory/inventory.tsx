import { Inventory } from "@/models/itemStore/inventory/Inventory";
import InventoryItemComponent from "./inventoryItem";

const InventoryComponent = ({inventory, setSelected}: {inventory: Inventory, setSelected: Function}) => {

	return (
		<>
		<div>
			<div>{inventory.getUserId()}'s Inventory</div>
			<div>Gold: {inventory.getGold()}</div>
			{inventory.getAllItems().map((item, itemIndex) => (
				<div key={itemIndex}>
					<InventoryItemComponent item={item} setSelected={setSelected}></InventoryItemComponent>
				</div>
			))}
		</div>
		</>
	);
}

export default InventoryComponent;