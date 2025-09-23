import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { getUserEventFromDatabase, claimDailyReward } from "@/backend/services/user/events/userEventService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
		const decodedToken = await verifyToken(request.headers.get("Authorization"));
		const firebaseUid = decodedToken.uid;
	
		const userEvent = new UserEvent(null, firebaseUid, "DAILYLOGIN");
		const result = await getUserEventFromDatabase(userEvent);
	
		return ApiResponse.success(result);
	  } catch (error) {
		return ApiResponse.fromError(error);
	  }
}

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { inventoryId } = await request.json();
		const result = await claimDailyReward(firebaseUid, inventoryId);
		return ApiResponse.success(result);
	  } catch (error) {
		return ApiResponse.fromError(error);
	  }
}
