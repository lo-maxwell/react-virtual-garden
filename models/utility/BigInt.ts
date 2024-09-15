export function stringToBigIntNumber(str: string): number | null {
	try {
	  // Convert string to BigInt
	  const bigIntValue = BigInt(str);
	  
	  // Safely convert BigInt to number, but be aware of potential precision loss
	  const numberValue = Number(bigIntValue);
  
	  // Check if the conversion caused precision loss
	  if (BigInt(numberValue) !== bigIntValue) {
		console.warn('Precision loss detected when converting BigInt to number');
	  }
  
	  return numberValue;
	} catch (error) {
	  console.error('Invalid BigInt string:', error);
	  return null; // Return null if the string is not a valid BigInt
	}
  }