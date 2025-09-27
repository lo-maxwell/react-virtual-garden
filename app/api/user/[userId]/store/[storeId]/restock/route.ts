import { restockStore } from "@/backend/services/store/storeService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { ApiResponse } from "@/utils/api/apiResponse";

//TODO: Investigate, doesn't require userId
export async function PATCH(request: Request, { params }: { params: { storeId: string } }) {
	const { storeId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { } = await request.json();
		const result = await restockStore(storeId, firebaseUid);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }