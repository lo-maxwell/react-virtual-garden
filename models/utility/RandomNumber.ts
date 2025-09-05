import crypto from 'crypto';

export function getRandomInt(min: number = 0, max: number = 1): number {
	if (!Number.isInteger(min) || !Number.isInteger(max)) {
		throw new Error("getRandomNumber requires integer arguments");
	}

	const low = Math.min(min, max);
	const high = Math.max(min, max);

	return crypto.randomInt(low, high + 1);
}

export function getRandomFloat(min: number = 0, max: number = 1): number {
	if (min >= max) {
	  throw new Error("getRandomFloat requires min < max");
	}
  
	// Generate a random 48-bit integer and normalize it into [0, 1)
	const buffer = crypto.randomBytes(6); // 6 bytes = 48 bits
	const randomInt = buffer.readUIntBE(0, 6);
	const randomFraction = randomInt / 2 ** 48;
  
	return min + randomFraction * (max - min);
  }