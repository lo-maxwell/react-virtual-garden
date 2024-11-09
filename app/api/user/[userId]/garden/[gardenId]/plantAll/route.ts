import { plantAll } from "@/backend/services/garden/gardenService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
        // TODO: Dependency on gardenId for validation purposes?
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	  const { plotIds, inventoryId, inventoryItemIdentifier} = await request.json();
	  const result = await plantAll(plotIds, inventoryId, inventoryItemIdentifier, firebaseUid);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }