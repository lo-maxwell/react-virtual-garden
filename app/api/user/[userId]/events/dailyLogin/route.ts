import { getUserEventEntityFromDatabase, claimDailyReward } from "@/backend/services/user/events/userEventService";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/firebase/authUtils";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token

		const userEvent = new UserEvent(firebaseUid, "DAILYLOGIN");
		const result = await getUserEventEntityFromDatabase(userEvent);
		return NextResponse.json(result, {status: 200});
	} catch (error) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
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
		return NextResponse.json(result, {status: 200});
	} catch (error) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
