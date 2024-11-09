import { getAccountFromDatabase } from "@/backend/services/account/accountService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const result = await getAccountFromDatabase(firebaseUid);
		return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }