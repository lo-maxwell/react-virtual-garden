//TODO: harvestGarden

import { harvestAll } from "@/backend/services/garden/gardenService";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
        // TODO: Dependency on gardenId for validation purposes?
	  const { plotIds, inventoryId, levelSystemId, replacementItem, instantHarvestKey} = await request.json();
	  const result = await harvestAll(plotIds, inventoryId, levelSystemId, userId, replacementItem, instantHarvestKey);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }