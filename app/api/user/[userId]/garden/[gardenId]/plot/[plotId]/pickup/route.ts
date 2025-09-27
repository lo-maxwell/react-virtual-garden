import { pickupDecoration } from "@/backend/services/garden/plot/plotService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function PATCH(request: Request, { params }: { params: { userId: string, gardenId: string, plotId: string } }) {
	const { userId, gardenId, plotId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { inventoryId, replacementItem} = await request.json();
		const result = await pickupDecoration(gardenId, plotId, inventoryId, firebaseUid, replacementItem);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }