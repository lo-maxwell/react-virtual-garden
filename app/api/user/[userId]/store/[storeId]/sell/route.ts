import { sellItem } from "@/backend/services/store/storeService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function PATCH(request: Request, { params }: { params: { storeId: string } }) {
	const { storeId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { itemIdentifier, sellQuantity, inventoryId } = await request.json();
		const result = await sellItem(storeId, firebaseUid, itemIdentifier, sellQuantity, inventoryId);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }