import { plantSeed } from "@/backend/services/garden/plot/plotService";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { plotId: string } }) {
	const { plotId } = params;
	try {
	  const { inventoryId, inventoryItemId} = await request.json();
	  const result = await plantSeed(plotId, inventoryId, inventoryItemId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }