import { setDefaultCustomClaims } from "@/backend/firebase/authentication/authService";
import { firebaseAdmin } from "@/backend/firebase/firebaseAdmin";
import { userIdExistsInDatabase } from "@/backend/services/user/userService";
import { BadRequestError, InternalServerError } from "@/utils/errors";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	
		// Get the userId from the request body
		const {} = await request.json();
		const userIdExists = await userIdExistsInDatabase(firebaseUid);
		if (userIdExists) {
			throw new Error(`userId already exists in database, cannot link new firebase account to it`);
		}

		// Call your function to set custom claims
		await setDefaultCustomClaims(firebaseUid);
	
		return NextResponse.json({ message: 'Custom claims set successfully' }, { status: 200 });
	  } catch (error) {
		if (error instanceof BadRequestError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof InternalServerError) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Catch-all for unanticipated errors
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    
	  }
  }