import { pickupDecoration } from "@/backend/services/garden/plot/plotService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string, plotId: string } }) {
	const { userId, plotId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	  const { inventoryId, replacementItem} = await request.json();
	  const result = await pickupDecoration(plotId, inventoryId, firebaseUid, replacementItem);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }