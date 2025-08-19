// Utility function for hydrating a Map from a plain object
export function hydrateMap<V>(
	plainObj: Record<string, any>,
	valueFromPlainObject: (plain: any) => V
  ): Map<string, V> {
	const map = new Map<string, V>();
	if (plainObj && typeof plainObj === 'object') {
	  for (const [key, value] of Object.entries(plainObj)) {
		map.set(key, valueFromPlainObject(value));
	  }
	}
	return map;
  }
  
  
  // Utility function for serializing a Map to a plain object
export function mapToPlainObject<K extends string, V>(
	map: Map<K, V>,
	valueToPlainObject: (val: V) => any
  ): Record<string, any> {
	const plain: Record<string, any> = {};
	map.forEach((val, key) => {
	  plain[key] = valueToPlainObject(val);
	});
	return plain;
  }
  