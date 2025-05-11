import { setDefaultCustomClaims } from "@/backend/firebase/authentication/authService";
import { createDefaultAccountInDatabase } from "@/backend/services/account/accountService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));

		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token

		const { } = await request.json();
		const result = await createDefaultAccountInDatabase(firebaseUid);
		await setDefaultCustomClaims(firebaseUid);
		
		return NextResponse.json({ message: 'Successfully created new user objects' }, { status: 200 });
		// return NextResponse.json(result, {status: 201});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }