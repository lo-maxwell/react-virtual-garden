import { buyItem } from "@/backend/services/store/storeService";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { storeId: string } }) {
	const { storeId } = params;
	try {
	  const { itemIdentifier, purchaseQuantity, inventoryId } = await request.json();
	  const result = await buyItem(storeId, itemIdentifier, purchaseQuantity, inventoryId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }