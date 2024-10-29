import { getUserFromDatabase } from "@/backend/services/user/userService";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
	//   const {} = await request.json();
	  const result = await getUserFromDatabase(userId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }