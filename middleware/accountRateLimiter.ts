const accountRateLimitPerSecond = new Map<string, number[]>(); // Store timestamps of requests for per-second limit
const accountRateLimitPerMinute = new Map<string, number[]>(); // Store timestamps of requests for per-minute limit

const ACCOUNT_RATE_LIMIT_PER_SECOND = 10; // max requests per second
const ACCOUNT_RATE_LIMIT_PER_MINUTE = 300; // max requests per minute
const TIME_WINDOW_SECOND = 1000; // 1 second in milliseconds
const TIME_WINDOW_MINUTE = 60 * 1000; // 1 minute in milliseconds

export async function checkAccountRateLimit(accountId: string, buffer: number) {
	const currentTime = Date.now();

	// Check per-second limit
	const timestampsPerSecond = accountRateLimitPerSecond.get(accountId) || [];
	const updatedTimestampsPerSecond = timestampsPerSecond.filter(timestamp => currentTime - timestamp < TIME_WINDOW_SECOND);
	updatedTimestampsPerSecond.push(currentTime);

	if (updatedTimestampsPerSecond.length > ACCOUNT_RATE_LIMIT_PER_SECOND) {
		return false; // Per-second rate limit exceeded
	}

	accountRateLimitPerSecond.set(accountId, updatedTimestampsPerSecond);

	// Check per-minute limit
	const timestampsPerMinute = accountRateLimitPerMinute.get(accountId) || [];
	const updatedTimestampsPerMinute = timestampsPerMinute.filter(timestamp => currentTime - timestamp < TIME_WINDOW_MINUTE);
	updatedTimestampsPerMinute.push(currentTime);

	if (updatedTimestampsPerMinute.length > ACCOUNT_RATE_LIMIT_PER_MINUTE + buffer) {
		return false; // Per-minute rate limit exceeded
	}

	accountRateLimitPerMinute.set(accountId, updatedTimestampsPerMinute);

	return true; // Within both limits
}