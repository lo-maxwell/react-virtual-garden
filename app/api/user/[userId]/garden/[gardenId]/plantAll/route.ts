import { plantAll } from "@/backend/services/garden/gardenService";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
        // TODO: Dependency on gardenId for validation purposes?
	  const { plotIds, inventoryId, inventoryItemIdentifier} = await request.json();
	  const result = await plantAll(plotIds, inventoryId, inventoryItemIdentifier, userId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }