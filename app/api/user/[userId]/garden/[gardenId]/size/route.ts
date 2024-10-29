import { getGardenSize } from "@/backend/services/garden/gardenService";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { userId: string, gardenId: string } }) {
	const { userId, gardenId } = params;
	try {
	//   const {} = await request.json();
	  const result = await getGardenSize(userId, gardenId);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }