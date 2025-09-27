import { getPlotFromDatabase } from "@/backend/services/garden/plot/plotService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function GET(request: Request, { params }: { params: { userId: string, gardenId: string, plotId: string } }) {
	const { userId, gardenId, plotId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const result = await getPlotFromDatabase(plotId, gardenId, firebaseUid);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }