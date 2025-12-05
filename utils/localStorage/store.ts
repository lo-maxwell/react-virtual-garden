import { Store } from "@/models/itemStore/store/Store";

export const loadStore = () => {
	try {
		const serializedStore = localStorage.getItem('store');
		if (serializedStore === null) {
			return [];
		}
		return Store.fromPlainObject(JSON.parse(serializedStore));
	} catch (err) {
		console.error('Could not load store', err);
		return [];
	}
};

export const saveStore = (store: Store) => {
	try {
		const serializedStore = JSON.stringify(store.toPlainObject());
		localStorage.setItem('store', serializedStore);
	} catch (err) {
		console.error('Could not save store', err);
	}
};