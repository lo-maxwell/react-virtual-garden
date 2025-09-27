import { plantAll } from "@/backend/services/garden/gardenService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function PATCH(request: Request, { params }: { params: { userId: string, gardenId: string } }) {
	const { userId, gardenId } = params;
	try {
        // TODO: Dependency on gardenId for validation purposes?
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { plotIds, inventoryId, inventoryItemIdentifier} = await request.json();
		const result = await plantAll(plotIds, inventoryId, inventoryItemIdentifier, gardenId, firebaseUid);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }