'use client'
import PlusSquareFilled from "@/components/icons/buttons/plus-square-filled";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import { useCallback, useEffect, useState } from "react";
import MinusSquareFilled from "@/components/icons/buttons/minus-square-filled";
import TradeWindowItemComponent from "./tradeWindowItem";
import { saveStore } from "@/utils/localStorage/store";
import { saveInventory } from "@/utils/localStorage/inventory";
import TrashCanFilled from "@/components/icons/buttons/trash-can-filled";
import ChangeQuantityButton from "./changeQuantityButton";
import { useStore } from "@/app/hooks/contexts/StoreContext";
import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import { InventoryTransactionResponse } from "@/models/itemStore/inventory/InventoryTransactionResponse";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";


const TradeWindowComponent = ({costMultiplier}: {costMultiplier: number}) => {
	const { inventory } = useInventory();
    const {selectedItem, toggleSelectedItem, owner, setOwner} = useSelectedItem();
	const defaultTradeWindowMessage = 'Trade Window';
	const resetSelected = () => {
		setTradeWindowMessage(defaultTradeWindowMessage);
		toggleSelectedItem(null);
	}
	const [quantity, setQuantity] = useState(1);
	const [tradeWindowMessage, setTradeWindowMessage] = useState(defaultTradeWindowMessage);
	
	const {store, updateRestockTimer} = useStore();

	const renderInventoryItem = () => {
		if (selectedItem && owner != null) {
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
							<TradeWindowItemComponent item={selectedItem} quantity={quantity} costMultiplier={costMultiplier}/>	
							<button className="ml-2 bg-gray-300 rounded w-7 h-7 text-center text-black hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2" onClick={resetSelected} data-testid="trash"><TrashCanFilled/></button>
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

	// //Resets quantity when selected changes
	// useEffect(() => {
	// 	setQuantity(1);
	// 	if (selectedItem != null) setTradeWindowMessage(defaultTradeWindowMessage);
	// }, [selectedItem]);
	
	// //Ensures quantity is never above/below bounds
	// useEffect(() => {
	// 	if (!selectedItem) return;
	// 	if (quantity > selectedItem.getQuantity()) {
	// 	  setQuantity(selectedItem.getQuantity());
	// 	}
	// 	if (quantity <= 0) {
	// 		setQuantity(1);
	// 	}
	//   }, [quantity, selectedItem]);

	useEffect(() => {
		if (!selectedItem) return;
		if (quantity > selectedItem.getQuantity()) {
		  setQuantity(selectedItem.getQuantity());
		} else if (quantity <= 0 && selectedItem.getQuantity() > 0) {
			setQuantity(1);
		}
	  }, [quantity, selectedItem]);


	useEffect(() => {
		setQuantity(1);
	  }, [selectedItem]);


	const onPlusClick = useCallback((delta: number) => {
		if (!selectedItem) return;
		setQuantity((quantity) => {
		  if (quantity + delta <= selectedItem.getQuantity()) {
			return quantity + delta;
		  }
		  return selectedItem.getQuantity();
		});
	  }, [selectedItem]);

	const onMinusClick = useCallback((delta: number) => {
		if (!selectedItem) return;
		setQuantity((quantity) => {
			if (quantity - delta > 0) {
			  return quantity - delta;
			}
			return 1;
		  });

	}, [selectedItem]);

	const onAllClick = useCallback(() => {
		if (!selectedItem || !owner) return;
		if (owner instanceof Store) {
			const maxBuy = Math.min(selectedItem.getQuantity(), Math.max(1, Math.floor(inventory.getGold()/(owner.getBuyPrice(selectedItem)))));
			setQuantity(maxBuy);
		} else if (owner instanceof Inventory) {
			setQuantity(selectedItem.getQuantity());
		} else {
			//should never occur
		}
	}, [selectedItem, inventory, owner]);

	const onConfirmClick = async () => {
		if (!selectedItem) return;
		if (owner instanceof Store) {
			if (!store.canBuyItem(selectedItem, quantity, inventory)) {
				setTradeWindowMessage(`Not enough gold for purchase!`);
				return;
			}
			try {
				const data = {
					itemIdentifier: selectedItem.itemData.id, 
					purchaseQuantity: quantity, 
					inventoryId: inventory.getInventoryId()
				}
				// Making the PATCH request to your API endpoint
				const response = await fetch(`/api/store/${store.getStoreId()}/buy`, {
				  method: 'PATCH',
				  headers: {
					'Content-Type': 'application/json',
				  },
				  body: JSON.stringify(data), // Send the data in the request body
				});
		  
				// Check if the response is successful
				if (!response.ok) {
				  throw new Error('Failed to purchase item');
				}
		  
				// Parsing the response data
				const result = await response.json();
				console.log('Successfully purchased item:', result);
				const buyResponse = store.buyItemFromStore(inventory, selectedItem, quantity);
				if (!buyResponse.isSuccessful()) {
					buyResponse.printErrorMessages();
					setTradeWindowMessage(buyResponse.messages[0]);
					return;
				}
				const itemTemplate = placeholderItemTemplates.getInventoryTemplate(result.identifier);
				if (!itemTemplate) {
					setTradeWindowMessage(`There was an error parsing the item id, please contact the developer`);
					return;
				}
				const inventoryItem = inventory.getItem(itemTemplate);
				if (!(inventoryItem.isSuccessful())) {
					setTradeWindowMessage(`There was an error parsing the item, please contact the developer`);
					return;
				}
				//TODO: Fix this
				//Hack to ensure consistency between database and model item ids
				//After we update the database, it returns an id, which we assign to the newly
				//added inventoryItem
				(inventoryItem.payload as InventoryItem).setInventoryItemId(result.id);

				
				setTradeWindowMessage('Purchase Successful!');
				updateRestockTimer();
			  } catch (error) {
				console.error(error);
				const response = new InventoryTransactionResponse();
				response.addErrorMessage(`Unknown database error while purchasing item`);
				setTradeWindowMessage(response.messages[0]);
				return;
			  } finally {
			  }
			
		} else if (owner instanceof Inventory) {
			try {
				const data = {
					itemIdentifier: selectedItem.itemData.id, 
					sellQuantity: quantity, 
					inventoryId: inventory.getInventoryId()
				}
				// Making the PATCH request to your API endpoint
				const response = await fetch(`/api/store/${store.getStoreId()}/sell`, {
				  method: 'PATCH',
				  headers: {
					'Content-Type': 'application/json',
				  },
				  body: JSON.stringify(data), // Send the data in the request body
				});
		  
				// Check if the response is successful
				if (!response.ok) {
				  throw new Error('Failed to sell item');
				}
		  
				// Parsing the response data
				const result = await response.json();
				console.log('Successfully sold item:', result);
				const sellResponse = store.sellItemToStore(inventory, selectedItem, quantity);
				if (!sellResponse.isSuccessful()) {
					sellResponse.printErrorMessages();
					setTradeWindowMessage(sellResponse.messages[0]);
					return;
				}
				const itemTemplate = placeholderItemTemplates.getInventoryTemplate(result.identifier);
				if (!itemTemplate) {
					setTradeWindowMessage(`There was an error parsing the item id, please contact the developer`);
					return;
				}
				const storeItem = store.getItem(itemTemplate);
				if (!(storeItem.isSuccessful())) {
					setTradeWindowMessage(`There was an error parsing the item, please contact the developer`);
					return;
				}
				//TODO: Fix this
				//Hack to ensure consistency between database and model item ids
				//After we update the database, it returns an id, which we assign to the newly
				//added inventoryItem
				(storeItem.payload as InventoryItem).setInventoryItemId(result.id);
				
				setTradeWindowMessage('Sale Successful!');
			  } catch (error) {
				console.error(error);
				const response = new InventoryTransactionResponse();
				response.addErrorMessage(`Unknown database error while purchasing item`);
				setTradeWindowMessage(response.messages[0]);
				return;
			  } finally {
			  }

		} else {
			//owner == null, should never occur
			return;
		}
		
		saveStore(store);
		saveInventory(inventory);
		toggleSelectedItem(null);
	}

	const renderQuantityButtons = () => {
		if (selectedItem) {
			return <>
				<div className="flex flex-row justify-between my-1 max-w-[90%]">
					<ChangeQuantityButton onClick={onAllClick} currentQuantity={quantity} className={"bg-gray-300 rounded w-12 h-12 font-bold text-center text-purple-600 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"} contents={<div data-testid="select-all">All</div>}/>
					<ChangeQuantityButton onClick={onPlusClick} currentQuantity={quantity} className={"bg-gray-300 rounded w-12 h-12 text-center text-green-500 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"} contents={<div data-testid="add-item"><PlusSquareFilled/></div>}/>
					<ChangeQuantityButton onClick={onMinusClick} currentQuantity={quantity} className={"bg-gray-300 rounded w-12 h-12 text-center text-red-500 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"} contents={<div data-testid="minus-item"><MinusSquareFilled/></div>}/>
					<button onClick={onConfirmClick} className="bg-gray-300 rounded h-12 px-2 text-center text-sm text-purple-600 font-semibold hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2" data-testid="confirm-transaction">Confirm Transaction</button>
				</div>
				</>
		} else {
			return <></>
		}
	}
	
	return (<>
		<div className={`my-8`}>
			<div>{tradeWindowMessage}</div>
			<div className="w-full">
			{renderInventoryItem()}
			{renderQuantityButtons()}
			</div>
		</div>
	</>);
}

export default TradeWindowComponent;