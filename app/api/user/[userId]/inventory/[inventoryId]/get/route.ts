import { getInventoryFromDatabase } from "@/backend/services/inventory/inventoryService";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { userId: string, inventoryId: string } }) {
	const { userId, inventoryId } = params;
	try {
	//   const {} = await request.json();
	  const result = await getInventoryFromDatabase(inventoryId, userId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }