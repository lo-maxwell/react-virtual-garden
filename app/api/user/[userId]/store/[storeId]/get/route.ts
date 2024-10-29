import { getStoreFromDatabase } from "@/backend/services/store/storeService";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { userId: string, storeId: string } }) {
	const { userId, storeId } = params;
	try {
	//   const {} = await request.json();
	  const result = await getStoreFromDatabase(storeId, userId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }