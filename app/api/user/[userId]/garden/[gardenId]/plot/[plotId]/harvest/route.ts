//TODO: Harvest plot

import { harvestPlot } from "@/backend/services/garden/plot/plotService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string, gardenId: string, plotId: string } }) {
	const { userId, gardenId, plotId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	  const { inventoryId, levelSystemId, numHarvests, replacementItem, instantHarvestKey } = await request.json();
	  const result = await harvestPlot(gardenId, plotId, inventoryId, levelSystemId, firebaseUid, numHarvests, replacementItem, instantHarvestKey);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }