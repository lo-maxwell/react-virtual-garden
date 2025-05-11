//TODO: harvestGarden

import { harvestAll } from "@/backend/services/garden/gardenService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string, gardenId: string } }) {
	const { userId, gardenId } = params;
	try {
        // TODO: Dependency on gardenId for validation purposes?
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	  const { plotIds, inventoryId, levelSystemId, numHarvests, replacementItem, instantHarvestKey} = await request.json();
	  const result = await harvestAll(plotIds, inventoryId, levelSystemId, gardenId, numHarvests, firebaseUid, replacementItem, instantHarvestKey);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }