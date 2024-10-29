import { pickupDecoration } from "@/backend/services/garden/plot/plotService";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string, plotId: string } }) {
	const { userId, plotId } = params;
	try {
	  const { inventoryId, replacementItem} = await request.json();
	  const result = await pickupDecoration(plotId, inventoryId, userId, replacementItem);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }