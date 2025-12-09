import { feedGoose, updateGooseName } from "@/backend/services/goose/gooseService";
import { ApiResponse } from "@/utils/api/apiResponse";
import { verifyToken } from "@/utils/firebase/authUtils";

export async function POST(request: Request, { params }: { params: { goosePenId: string, gooseId: string } }) {
	const { goosePenId, gooseId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { inventoryId, inventoryItemIdentifier, feedQuantity } = await request.json();
		// For future use, may be possible to feed multiple items at once
		const hardcodedFeedQuantity = 1;
		const result = await feedGoose(firebaseUid, goosePenId, gooseId, inventoryId, inventoryItemIdentifier, hardcodedFeedQuantity);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }