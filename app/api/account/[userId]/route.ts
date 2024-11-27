import { getAccountFromDatabase } from "@/backend/services/account/accountService";
import { NextResponse } from "next/server";
//to be obseleted
export async function GET(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
	  const result = await getAccountFromDatabase(userId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }
