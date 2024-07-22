import InventoryItemComponent from "@/components/inventory/inventoryItem";
import { Store } from "@/models/itemStore/store/Store";

const StoreComponent = ({store, onInventoryItemClickFunction}: {store: Store, onInventoryItemClickFunction: (arg: any) => void}) => {

	return (
		<>
		<div className="w-[80%]">
			<div>{store.getStoreName()}</div>
			{store.getAllItems().map((item, itemIndex) => (
				<div key={itemIndex}>
					<InventoryItemComponent item={item} onClickFunction={onInventoryItemClickFunction} costMultiplier={store.getBuyMultiplier()}></InventoryItemComponent>
				</div>
			))}
		</div>
		</>
	);
}

export default StoreComponent;