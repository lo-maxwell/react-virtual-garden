import colors from "@/components/colors/colors";
import ItemStoreComponent from "@/components/itemStore/itemStore";
import { useStore } from "@/app/hooks/contexts/StoreContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTimeString } from "@/models/utility/Time";
const StoreComponent = ({ onInventoryItemClickFunction, forceRefreshKey }: { onInventoryItemClickFunction: (arg: any) => void, forceRefreshKey: number }) => {
	const { store, restockStore } = useStore();

	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [canRestock, setCanRestock] = useState<boolean>(false);
	const [errorRestocking, setErrorRestocking] = useState<boolean>(false);
	const [restockMessage, setRestockMessage] = useState<string>("");

	const resetMessageTimeout = useRef<NodeJS.Timeout | null>(null);

	// Timer updater
	const updateTimer = useCallback(() => {
		const now = Date.now();
		const calculatedTimeRemaining = Math.max(0, store.getLastRestockTime() + store.getRestockInterval() - now);
		setTimeRemaining(calculatedTimeRemaining);
		setCanRestock(calculatedTimeRemaining === 0);
	}, [store]);

	useEffect(() => {
		setErrorRestocking(false);
		updateTimer();
		const intervalId = setInterval(updateTimer, 1000);
		return () => clearInterval(intervalId);
	}, [updateTimer]);

	// Memoized store discount string
	const storeDiscountString = useMemo(() => {
		const getPriceColor = () => {
			const costMultiplier = store.getBuyMultiplier();
			if (costMultiplier > 2) return colors.store.storeHighPrice;
			if (costMultiplier === 2) return colors.store.storeRegularPrice;
			return colors.store.storeLowPrice;
		};

		const floatToPercentageString = (float: number) => {
			const percentageValue = float * 100;
			return percentageValue % 1 === 0
				? percentageValue.toFixed(0) + "%"
				: percentageValue.toFixed(1) + "%";
		};

		return (
			<span>
				{store.getStoreName()} sells items for{" "}
				<span className={`font-semibold ${getPriceColor()}`}>
					{" "}
					{floatToPercentageString(store.getBuyMultiplier())}{" "}
				</span>
				of their base value.
			</span>
		);
	}, [store]);

	const getStoreRestockTimeString = useCallback(() => {
		const time = Math.ceil(Math.max(timeRemaining, 0) / 1000);
		return getTimeString(time);
	}, [timeRemaining]);

	const handleRestock = useCallback(async () => {
		const restockResult = await restockStore();

		if (restockResult === "SUCCESS") {
			setCanRestock(false);
			setTimeRemaining(Math.max(0, store.getLastRestockTime() - Date.now()));
			setErrorRestocking(false);
			setRestockMessage("Successfully restocked!");
		} else if (restockResult === "NOT TIME") {
			setErrorRestocking(true);
			setRestockMessage("It is not time to restock!");
			setCanRestock(false);
			setTimeRemaining(Math.max(0, store.getLastRestockTime() - Date.now()));
		} else if (restockResult === "NOT_MISSING_STOCK") {
			setErrorRestocking(true);
			setRestockMessage("There is nothing to restock.");
		} else {
			setErrorRestocking(true);
			setRestockMessage(
				"There was an error restocking. Please refresh the page. If this error persists, go to profile -> settings -> force sync account."
			);
		}

		if (resetMessageTimeout.current) {
			clearTimeout(resetMessageTimeout.current);
		}

		resetMessageTimeout.current = setTimeout(() => {
			setErrorRestocking(false);
			setRestockMessage("");
		}, 10000);
	}, [restockStore, store]);

	return (
		<div className="w-[80%]" key={forceRefreshKey}>
			<div className="font-bold text-3xl">{store.getStoreName()}</div>
			<div>{storeDiscountString}</div>
			<ItemStoreComponent
				itemStore={store}
				onInventoryItemClickFunction={onInventoryItemClickFunction}
				costMultiplier={store.getBuyMultiplier()}
				maxHeightPercentage={60}
				displayFilter={true}
				initialSubtypeFilter={"Seed"}
				initialCategoryFilter={null}
			/>
			<div className="mt-2 text-sm text-gray-600">
				<button
					onClick={handleRestock}
					disabled={!canRestock}
					className={`p-2 rounded ${canRestock ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"}`}
				>
					{canRestock ? "Restock Store" : `Restock available in: ${getStoreRestockTimeString()}`}
				</button>
				<div className={`my-2 text-sm ${errorRestocking ? "text-red-600" : "text-green-800"}`}>{restockMessage}</div>
			</div>
		</div>
	);
};

export default StoreComponent;