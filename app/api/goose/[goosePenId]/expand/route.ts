import { expandGoosePen } from "@/backend/services/goose/goosePenService";
import { feedGoose, updateGooseName } from "@/backend/services/goose/gooseService";
import { ApiResponse } from "@/utils/api/apiResponse";
import { verifyToken } from "@/utils/firebase/authUtils";

export async function POST(request: Request, { params }: { params: { goosePenId: string } }) {
	const { goosePenId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { inventoryId } = await request.json();
		const result = await expandGoosePen(firebaseUid, goosePenId, inventoryId);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }