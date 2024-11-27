import { getInventoryFromDatabase } from "@/backend/services/inventory/inventoryService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { userId: string, inventoryId: string } }) {
	const { userId, inventoryId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	//   const {} = await request.json();
	  const result = await getInventoryFromDatabase(inventoryId, firebaseUid);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }