
const ipRateLimit = new Map<string, number[]>(); // Store timestamps of requests

const IP_RATE_LIMIT = 600; // max requests
const TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

export async function checkIPRateLimit(ip: string, buffer: number) {
	const currentTime = Date.now();
	const timestamps = ipRateLimit.get(ip) || [];

	// Remove timestamps older than 60 seconds
	const updatedTimestamps = timestamps.filter(timestamp => currentTime - timestamp < TIME_WINDOW);

	// Add the current request timestamp
	updatedTimestamps.push(currentTime);

	// Check if the number of requests in the last 60 seconds exceeds the limit
	if (updatedTimestamps.length > IP_RATE_LIMIT + buffer) {
		return false; // Rate limit exceeded
	}

	// Update the stored timestamps
	ipRateLimit.set(ip, updatedTimestamps);
	return true; // Within limit
}