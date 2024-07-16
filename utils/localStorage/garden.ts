import { Garden } from "@/models/garden/Garden";

export const loadGarden = () => {
	try {
	  const serializedGarden = localStorage.getItem('garden');
	  if (serializedGarden === null) {
		return [];
	  }
	  return JSON.parse(serializedGarden);
	} catch (err) {
	  console.error('Could not load garden', err);
	  return [];
	}
  };
  
export const saveInventory = (garden: Garden) => {
	try {
		const serializedGarden = JSON.stringify(garden);
		localStorage.setItem('garden', serializedGarden);
	} catch (err) {
		console.error('Could not save garden', err);
	}
};