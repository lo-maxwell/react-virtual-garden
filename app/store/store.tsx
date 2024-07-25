import InventoryItemComponent from "@/components/inventory/inventoryItem";
import { useStore } from "@/hooks/contexts/StoreContext";
import { useEffect, useState } from "react";

const StoreComponent = ({onInventoryItemClickFunction}: {onInventoryItemClickFunction: (arg: any) => void}) => {

	const {store, restockStore, resetStore} = useStore();

	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [canRestock, setCanRestock] = useState<boolean>(false);

	const DEFAULT_RESTOCK_TIME = 60000;

	useEffect(() => {
		const updateTimer = () => {
			const now = Date.now();
			const calculatedTimeRemaining = Math.max(0, DEFAULT_RESTOCK_TIME + store.getRestockTime() - now);
			setTimeRemaining(calculatedTimeRemaining);
			if (calculatedTimeRemaining == 0) {
				setCanRestock(true);
			}
		};

		// Update timer initially and set interval
		updateTimer();
		const intervalId = setInterval(updateTimer, 1000);

		// Clear interval on component unmount
		return () => clearInterval(intervalId);
	}, [store]);


	const handleRestock = () => {
		if (Date.now() - store.getRestockTime() >= DEFAULT_RESTOCK_TIME) {
			console.log('store restocked');
			store.setRestockTime(Date.now());
			const response = restockStore();
			if (!response) {
				console.log('there was an error');
				return;
			}
			
			setCanRestock(false);
		} else {
			console.log('restock not ready');
			const now = Date.now();
			const calculatedTimeRemaining = Math.max(0, DEFAULT_RESTOCK_TIME + store.getRestockTime() - now);
			setTimeRemaining(calculatedTimeRemaining);
			if (calculatedTimeRemaining == 0) {
				setCanRestock(true);
			} else {
				setCanRestock(false);
			}
		}
	}

	return (
		<>
		<div className="w-[80%]">
			<div>{store.getStoreName()}</div>
			{store.getAllItems().map((item, itemIndex) => (
				<div key={itemIndex}>
					<InventoryItemComponent item={item} onClickFunction={onInventoryItemClickFunction} costMultiplier={store.getBuyMultiplier()}></InventoryItemComponent>
				</div>
			))}
			<div>
				<button
					onClick={handleRestock}
					disabled={!canRestock}
					className={`bg-gray-300 px-4 py-1 mt-2 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${!canRestock ? 'opacity-50 cursor-not-allowed' : ''}`}
				>
					Restock Store
				</button>
				<div className="mt-2 text-sm text-gray-600">
					{canRestock ? 'Restock available' : `Time remaining: ${Math.ceil(timeRemaining / 1000)}s`}
				</div>
			</div>
			<div>
				<button
					onClick={resetStore}
					className={`bg-gray-300 px-4 py-1 mt-2 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}
				>
					Reset Store (Debug)
				</button>
			</div>
		</div>
		</>
	);
}

export default StoreComponent;