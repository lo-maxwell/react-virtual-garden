import colors from "@/components/colors/colors";
import ItemStoreComponent from "@/components/itemStore/itemStore";
import { useStore } from "@/app/hooks/contexts/StoreContext";
import { useEffect, useState } from "react";
import { getTimeString } from "@/models/utility/Time";

const StoreComponent = ({onInventoryItemClickFunction, forceRefreshKey}: {onInventoryItemClickFunction: (arg: any) => void, forceRefreshKey: number}) => {

	const {store, restockStore} = useStore();

	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [canRestock, setCanRestock] = useState<boolean>(false);
	const [errorRestocking, setErrorRestocking] = useState<boolean>(false);
	const [restockMessage, setRestockMessage] = useState<string>("");
	

	useEffect(() => {
		setErrorRestocking(false);
		const updateTimer = () => {
			const now = Date.now();
			const calculatedTimeRemaining = Math.max(0, store.getLastRestockTime() + store.getRestockInterval() - now);
			setTimeRemaining(calculatedTimeRemaining);
			if (calculatedTimeRemaining == 0) {
				setCanRestock(true);
			} else {
				setCanRestock(false);
			}
		};
		// Update timer initially and set interval
		updateTimer();
		const intervalId = setInterval(updateTimer, 1000);

		// Clear interval on component unmount
		return () => {
			clearInterval(intervalId);
		}
	}, [store]);

	const RenderStoreDiscountString = () => {

		const getPriceColor = () => {
			const costMultiplier = store.getBuyMultiplier();
			if (costMultiplier > 2) {
				return colors.store.storeHighPrice;
			} else if (costMultiplier == 2) {
				return colors.store.storeRegularPrice;
			} else if (costMultiplier < 2) {
				return colors.store.storeLowPrice;
			}
			return '';
		}

		const floatToPercentageString = (float: number) => {
			const percentageValue = float * 100;
			const percentageString = percentageValue % 1 === 0 
				? percentageValue.toFixed(0) + "%" 
				: percentageValue.toFixed(1) + "%";
			return percentageString;
		}

		return <>
			<span>
				{store.getStoreName()} sells items for 
				<span className={`font-semibold ${getPriceColor()}`}> {floatToPercentageString(store.getBuyMultiplier())} </span>
				 of their base value.
			</span>
		</>
	}

	const getStoreRestockTimeString = () => {
		const time = Math.ceil(Math.max(timeRemaining, 0) / 1000);
		const timeString = getTimeString(time);
		return timeString;
	}

	let resetMessageTimeout: NodeJS.Timeout | null = null; // Declare a variable to hold the timeout ID
	const handleRestock = async () => {
		const restockResult = await restockStore();
		if (restockResult === "SUCCESS") {
			setCanRestock(false);
			const calculatedTimeRemaining = Math.max(0, store.getLastRestockTime() - Date.now());
			setTimeRemaining(calculatedTimeRemaining);
			setErrorRestocking(false);
			setRestockMessage("Successfully restocked!");
		} else if (restockResult === 'NOT TIME') {
			setErrorRestocking(true);
			setRestockMessage("It is not time to restock!");
			setCanRestock(false);
			const calculatedTimeRemaining = Math.max(0, store.getLastRestockTime() - Date.now());
			setTimeRemaining(calculatedTimeRemaining);
		} else if (restockResult === 'NOT_MISSING_STOCK') {
			setErrorRestocking(true);
			setRestockMessage("There is nothing to restock.");
		} else {
			setErrorRestocking(true);
			setRestockMessage("There was an error restocking. Please refresh the page. If this error persists, go to profile -> settings -> force sync account.");
		}
		if (resetMessageTimeout) {
			clearTimeout(resetMessageTimeout);
		}
		resetMessageTimeout = setTimeout(() => {
			setErrorRestocking(false);
			setRestockMessage("");
		}, 10000); // Clear message after 10 seconds
	};

	return (
		<>
		<div className="w-[80%]" key={forceRefreshKey}>
			<div className="font-bold text-3xl">{store.getStoreName()}</div>
			<div>{RenderStoreDiscountString()}</div>
			<ItemStoreComponent itemStore={store} onInventoryItemClickFunction={onInventoryItemClickFunction} costMultiplier={store.getBuyMultiplier()} maxHeightPercentage={60} displayFilter={true} initialSubtypeFilter={"Seed"} initialCategoryFilter={null}/>
			<div>
				<div className="mt-2 text-sm text-gray-600">
					<button 
						onClick={handleRestock} 
						disabled={!canRestock} 
						className={`p-2 rounded ${canRestock ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}
					>
						{canRestock ? 'Restock Store' : `Restock available in: ${getStoreRestockTimeString()}`}
					</button>
					<div className={`my-2 text-sm ${errorRestocking ? 'text-red-600' : 'text-green-800'}`}>{restockMessage}</div>
				</div>
			</div>
		</div>
		</>
	);
}

export default StoreComponent;