import { verifyToken } from "@/utils/firebase/authUtils";
import { ApiResponse } from "@/utils/api/apiResponse";
import { getGoosePenFromDatabase } from "@/backend/services/goose/gooseService";

export async function GET(request: Request, { params }: { params: { goosePenId: string} }) {
	const { goosePenId } = params;
	try {
	//   const {} = await request.json();
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const result = await getGoosePenFromDatabase(goosePenId, firebaseUid);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }