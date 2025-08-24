import crypto from 'crypto';

export const handler = async (event) => {
	const { queries } = event; // Updated to accept queries object

	// Validate input
	if (!Array.isArray(queries) || queries.length === 0) {
		return {
		statusCode: 400,
		body: JSON.stringify({ message: 'Invalid queries input' })
		};
	}

	// Helper function to process a single query
	const processQuery = (query) => {
		const { inputMin, inputMax, inputQuantity } = query;
		
		const minVal = inputMin ?? 0;
		const maxVal = inputMax ?? 1;
		const quantity = Math.min(inputQuantity ?? 1, 100);
		const low = Math.min(minVal, maxVal);
		const high = Math.max(minVal, maxVal);
		const values = [];
		for (let i = 0; i < quantity; i++) {
			values.push(crypto.randomInt(low, high + 1));
		}

		return {result: values};
	};

	const results = queries.map(q => {
		try {
		return processQuery(q);
		} catch (err) {
		return { error: err.message };
		}
	});

	// Return all results if there are multiple queries
	return {
		statusCode: 200,
		body: JSON.stringify(results) // Return all results
	};
};