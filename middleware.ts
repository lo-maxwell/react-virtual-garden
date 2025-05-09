// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkIPRateLimit } from './middleware/ipRateLimiter';
import { verifyToken } from './utils/firebase/authUtils';
import { checkAccountRateLimit } from './middleware/accountRateLimiter';

const exemptRoutesFromAuthorization: string[] = [
    //There's nothing here right now
]

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

        // Check if the route is exempt from authorization
        // const isExemptRoute = exemptRoutesFromAuthorization.some(route => {
        //     // Check if the route matches the exempt pattern
        //     return pathname.startsWith(route.replace(/\[.*?\]/, '')); // Handle dynamic segments
        // });

        // If the route is not exempt, verify the token
        // let firebaseUid: string = 'INVALID_TOKEN';
        // if (!isExemptRoute) {
        //     try {
        //         const token = request.headers.get('Authorization');
        //         if (token) {
        //             console.log('token:')
        //             console.log(token)
        //             const decodedToken = await verifyToken(token);
        //             firebaseUid = decodedToken.uid; // Extract UID from the decoded token
        //         } else {
        //             console.log('no token found')
        //             return NextResponse.json({ error: "Failed to generate authentication token."}, {status: 401});
        //         }
        //     } catch (error) {
        //         return NextResponse.json({ error: "Invalid token." }, { status: 401 });
        //     }
        // }

        // if (!isExemptRoute) {
        //     if (!(await checkAccountRateLimit(firebaseUid, buffer))) {
        //         return NextResponse.json({ error: "Account rate limit exceeded. Try again later." }, { status: 429 });
        //     }
        // }
	}

	return NextResponse.next(); // Proceed to the next middleware or route handler
}