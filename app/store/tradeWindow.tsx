'use client'
import PlusSquareFilled from "@/components/icons/buttons/plus-square-filled";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import { useEffect, useState } from "react";
import MinusSquareFilled from "@/components/icons/buttons/minus-square-filled";
import TradeWindowItemComponent from "./tradeWindowItem";
import { saveStore } from "@/utils/localStorage/store";
import { saveInventory } from "@/utils/localStorage/inventory";
import TrashCanFilled from "@/components/icons/buttons/trash-can-filled";


const TradeWindowComponent = ({store, inventory, selected, setSelected, owner, costMultiplier}: {store: Store, inventory: Inventory, selected: InventoryItem | null, setSelected: (arg: any) => void, owner: Store | Inventory | null, costMultiplier: number}) => {
	const defaultTradeWindowMessage = 'Trade Window';
	const resetSelected = () => {
		setTradeWindowMessage(defaultTradeWindowMessage);
		setSelected(null);
	}
	const [quantity, setQuantity] = useState(1);
	const [tradeWindowMessage, setTradeWindowMessage] = useState(defaultTradeWindowMessage);
	
	const renderInventoryItem = () => {
		if (selected && owner != null) {
			let operationString = "";
			if (owner instanceof Store) {
				operationString = "Buying: ";
			} else if (owner instanceof Inventory) {
				operationString = "Selling: ";
			}
			return <>
					<div>
						<div>{operationString}</div>
						<div className="flex flex-row justify-center items-center">
							<TradeWindowItemComponent item={selected} quantity={quantity} costMultiplier={costMultiplier}/>	
							<button className="ml-2 bg-gray-300 rounded w-7 h-7 text-center text-black hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2" onClick={resetSelected}><TrashCanFilled/></button>
						</div>
					</div>
				</>;
		} else {
			return <>
			<div>
				Select an item to buy or sell!
			</div>
			</>
		}
	}

	useEffect(() => {
		setQuantity(1);
		if (selected != null) setTradeWindowMessage(defaultTradeWindowMessage);
	}, [selected]);

	const onPlusClick = () => {
		if (!selected) return;
		if (quantity + 1 <= selected.getQuantity()) {
			setQuantity(quantity + 1);
		}
	}

	const onMinusClick = () => {
		if (!selected) return;
		if (quantity - 1 > 0) {
			setQuantity(quantity - 1);
		}

	}

	const onConfirmClick = () => {
		if (!selected) return;
		if (owner instanceof Store) {
			const response = store.buyItemFromStore(inventory, selected, quantity);
			if (!response.isSuccessful()) {
				response.printErrorMessages();
				setTradeWindowMessage(response.messages[0]);
				return;
			}
			setTradeWindowMessage('Purchase Successful!');
		} else if (owner instanceof Inventory) {
			const response = store.sellItemToStore(inventory, selected, quantity);
			if (!response.isSuccessful()) {
				response.printErrorMessages();
				setTradeWindowMessage(response.messages[0]);
				return;
			}
			setTradeWindowMessage('Sale Successful!');
		} else {
			//owner == null, should never occur
			return;
		}
		saveStore(store);
		saveInventory(inventory);
		setSelected(null);

	}

	const renderQuantityButtons = () => {
		if (selected) {
			return <>
				<div className="flex flex-row justify-around my-1">
					<button onClick={onPlusClick} className="bg-gray-300 rounded w-12 h-12 text-center text-green-500 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"><PlusSquareFilled/></button>
					<button onClick={onMinusClick} className="bg-gray-300 rounded w-12 h-12 text-center text-red-500 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"><MinusSquareFilled/></button>
					<button onClick={onConfirmClick} className="bg-gray-300 rounded h-12 px-2 text-center text-sm text-purple-600 font-semibold hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">Confirm Transaction</button>
				</div>
				</>
		} else {
			return <></>
		}
	}
	
	return (<>
		<div>{tradeWindowMessage}</div>
		<div className="w-[80%]">
		{renderInventoryItem()}
		{renderQuantityButtons()}
		</div>
	</>);
}

export default TradeWindowComponent;