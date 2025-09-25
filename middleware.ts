// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkIPRateLimit } from './middleware/ipRateLimiter';

export async function middleware(request: NextRequest) {
    // Check if the middleware should be ignored
	if (process.env.IGNORE_MIDDLEWARE === 'true') {
		return NextResponse.next(); // Skip the middleware
	}
    
	const ip = request.headers.get('x-forwarded-for') || ''; // Get the user's IP address

	if (!ip) {
		return NextResponse.json({ error: "IP address not found." }, { status: 400 }); // Error if IP is not found
	}

	// Check if the request is for an API route
	const pathname = new URL(request.url).pathname; // Use URL constructor to get pathname
	let buffer = 0; // Default buffer

	//Allow buffer to let frontend still query for login and such, to keep in sync with the database
	if (pathname.startsWith('/api/account') || pathname.startsWith('/api/auth')) {
		buffer = 25; // Set buffer to 25 for /api/account routes
	}

	if (pathname.startsWith('/api')) {
		if (!(await checkIPRateLimit(ip, buffer))) {
			return NextResponse.json({ error: "IP rate limit exceeded. Try again later." }, { status: 429 });
		}
	}

	return NextResponse.next(); // Proceed to the next middleware or route handler
}