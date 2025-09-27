import { setDefaultCustomClaims } from "@/backend/firebase/authentication/authService";
import { createDefaultAccountInDatabase } from "@/backend/services/account/accountService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function POST(request: Request) {
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));

		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token

		const { } = await request.json();
		await createDefaultAccountInDatabase(firebaseUid);
		await setDefaultCustomClaims(firebaseUid);
		return ApiResponse.success('Successfully created new user objects' );
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }