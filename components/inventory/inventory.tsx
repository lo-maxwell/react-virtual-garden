import { Inventory } from "@/models/inventory/Inventory";
import InventoryItemComponent from "./inventoryItem";

const InventoryComponent = ({inventory, setSelected}: {inventory: Inventory, setSelected: Function}) => {


	return (
		<>
		<div>
			<div>Inventory Header</div>
			{inventory.getAllItems().map((item, itemIndex) => (
				<InventoryItemComponent key={itemIndex} item={item} setSelected={setSelected}></InventoryItemComponent>
			))}
		</div>
		</>
	);
}

export default InventoryComponent;