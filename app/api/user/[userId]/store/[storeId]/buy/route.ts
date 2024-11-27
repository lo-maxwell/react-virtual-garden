import { buyItem } from "@/backend/services/store/storeService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
//TODO: Investigate, doesn't require userId
export async function PATCH(request: Request, { params }: { params: { storeId: string } }) {
	const { storeId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	  const { itemIdentifier, purchaseQuantity, inventoryId } = await request.json();
	  const result = await buyItem(storeId, itemIdentifier, purchaseQuantity, inventoryId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }