// middleware/rateLimit.ts
const rateLimit = new Map<string, number[]>(); // Store timestamps of requests

const RATE_LIMIT = 600; // max requests
const TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

export async function checkRateLimit(ip: string, buffer: number) {
	const currentTime = Date.now();
	const timestamps = rateLimit.get(ip) || [];

	// Remove timestamps older than 60 seconds
	const updatedTimestamps = timestamps.filter(timestamp => currentTime - timestamp < TIME_WINDOW);

	// Add the current request timestamp
	updatedTimestamps.push(currentTime);

	// Check if the number of requests in the last 60 seconds exceeds the limit
	if (updatedTimestamps.length > RATE_LIMIT + buffer) {
		return false; // Rate limit exceeded
	}

	// Update the stored timestamps
	rateLimit.set(ip, updatedTimestamps);
    console.log('updated rate limiter map for ip ' + ip);
	return true; // Within limit
}