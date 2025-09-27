import { setDefaultCustomClaims } from "@/backend/firebase/authentication/authService";
import { firebaseAdmin } from "@/backend/firebase/firebaseAdmin";
import { userIdExistsInDatabase } from "@/backend/services/user/userService";
import { BadRequestError, InternalServerError } from "@/utils/errors";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function POST(request: Request) {
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	
		// Get the userId from the request body
		const {} = await request.json();
		const userIdExists = await userIdExistsInDatabase(firebaseUid);
		if (userIdExists) {
			return NextResponse.json({ success: false, error: { code: ApiErrorCodes.BAD_REQUEST, message: `userId already exists in database, cannot link new firebase account to it` } }, { status: 400 });
		}

		// Call your function to set custom claims
		await setDefaultCustomClaims(firebaseUid);
		return ApiResponse.success('Custom claims set successfully');
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }