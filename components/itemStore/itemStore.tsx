import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import { ItemSubtype, ItemSubtypes } from "@/models/items/ItemTypes";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import { useState } from "react";
import InventoryItemComponent from "../inventory/inventoryItem";
import DropdownMenu from "../lists/DropdownMenu";
import StoreItemComponent from "./storeItem";

const ItemStoreComponent = ({itemStore, onInventoryItemClickFunction, costMultiplier, maxHeightPercentage}: {itemStore: Store | Inventory, onInventoryItemClickFunction: (arg: any) => void, costMultiplier: number, maxHeightPercentage: number}) => {
	const [subtypeFilter, setSubtypeFilter] = useState<ItemSubtype | null>(null);
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
	const {selectedItem, owner} = useSelectedItem();

	const getItemList = () => {
		if (subtypeFilter && categoryFilter) {
			return itemStore.getItemsBySubtype(subtypeFilter, categoryFilter);
		} else if (subtypeFilter) {
			return itemStore.getItemsBySubtype(subtypeFilter);
		} else {
			return itemStore.getAllItems();
		}
	}

	const RenderSubtypeFilter = () => {
		const subtypes = itemStore.getAllSubtypes();
		const selectSubtypeFilter = (value: string | null) => {
			if (value) {
				if (value === ItemSubtypes.SEED.name) {
					setSubtypeFilter("Seed");
				} else if (value === ItemSubtypes.HARVESTED.name) {
					setSubtypeFilter("HarvestedItem");
				} else if (value === ItemSubtypes.BLUEPRINT.name) {
					setSubtypeFilter("Blueprint");
				} else {
					setSubtypeFilter(null);
				}
			} else {
				setSubtypeFilter(null);
			}
			setCategoryFilter(null);
		}

		const renderOptionLabel = (option: string | null) => {
			if (option === ItemSubtypes.SEED.name) {
				return "Seed";
			} else if (option === ItemSubtypes.HARVESTED.name) {
				return "Harvested";
			} else if (option === ItemSubtypes.BLUEPRINT.name) {
				return "Blueprint";
			} else {
				return "";
			}
		}

		return (<>
		<DropdownMenu
            label="Filter by Type"
            options={subtypes}
            selectedValue={subtypeFilter}
            onChange={selectSubtypeFilter}
            renderOptionLabel={renderOptionLabel} // Just return the option since it's a string
        />

		</>
		);
	}


	const RenderCategoryFilter = () => {
		if (!subtypeFilter) return <></>;
		const categories = itemStore.getAllCategories(subtypeFilter);
		const selectCategoryFilter = (value: string | null) => {
			setCategoryFilter(value);
		}

		return (<>
		<DropdownMenu
            label="Filter by Category"
            options={categories}
            selectedValue={categoryFilter}
            onChange={selectCategoryFilter}
            renderOptionLabel={(option) => option} // Just return the option since it's a string
        />

		</>
		);
	}

	const RenderItemList = () => {
		if (getItemList().length === 0) {
			if (itemStore instanceof Store) {
				return <div>{`${(itemStore as Store).getStoreName()} is out of stock. Come back later!`}</div>
			}
			return <div>{`This seems to be empty...`}</div>
		}
		return getItemList().map((item, itemIndex) => {
			//Do not display items with 0 quantity
			if (item.getQuantity() <= 0) {
				return <div key={itemIndex}></div>;
			}
			if (itemStore instanceof Store) {
				return (
					<div key={itemIndex}>
						<StoreItemComponent itemStore={itemStore} item={item} onClickFunction={onInventoryItemClickFunction} costMultiplier={costMultiplier} focus={item == selectedItem}></StoreItemComponent>
					</div>
				)
			} else { //itemStore instanceof Inventory
				return (
					<div key={itemIndex}>
						<InventoryItemComponent itemStore={itemStore} item={item} onClickFunction={onInventoryItemClickFunction} costMultiplier={costMultiplier} focus={item == selectedItem}></InventoryItemComponent>
					</div>
				)
			}
	})
	}

	return (<>
		<div>{RenderSubtypeFilter()}</div>
		<div>{RenderCategoryFilter()}</div>
		<div className={`max-h-[${maxHeightPercentage}vh] overflow-y-auto`}>
		{RenderItemList()}
		</div>
		</>
	);
}

export default ItemStoreComponent;