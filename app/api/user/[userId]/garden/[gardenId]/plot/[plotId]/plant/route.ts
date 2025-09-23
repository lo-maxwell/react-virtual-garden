import { plantSeed } from "@/backend/services/garden/plot/plotService";
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
		const { inventoryId, inventoryItemIdentifier} = await request.json();
		const result = await plantSeed(gardenId, plotId, inventoryId, inventoryItemIdentifier, firebaseUid);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }