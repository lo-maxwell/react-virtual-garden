import { Garden } from "@/models/garden/Garden";

export const loadGarden = () => {
	try {
	  const serializedGarden = localStorage.getItem('garden');
	  if (serializedGarden === null) {
		return [];
	  }
	  return Garden.fromPlainObject(JSON.parse(serializedGarden));
	} catch (err) {
	  console.error('Could not load garden', err);
	  return [];
	}
  };
  
export const saveGarden = (garden: Garden) => {
	try {
		const serializedGarden = JSON.stringify(garden.toPlainObject());
		localStorage.setItem('garden', serializedGarden);
	} catch (err) {
		console.error('Could not save garden', err);
	}
};