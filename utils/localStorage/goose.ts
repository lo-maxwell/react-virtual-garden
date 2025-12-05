import GoosePen from "@/models/goose/GoosePen";


export const loadGoosePen = () => {
	try {
		const serializedGoosePen = localStorage.getItem('goosePen');
		if (serializedGoosePen === null) {
			return [];
		}
		return GoosePen.fromPlainObject(JSON.parse(serializedGoosePen));
	} catch (err) {
		console.error('Could not load goose pen', err);
		return [];
	}
};

export const saveGoosePen = (goosePen: GoosePen) => {
	try {
		const serializedGoosePen = JSON.stringify(goosePen.toPlainObject());
		localStorage.setItem('goosePen', serializedGoosePen);
	} catch (err) {
		console.error('Could not save goose pen', err);
	}
};