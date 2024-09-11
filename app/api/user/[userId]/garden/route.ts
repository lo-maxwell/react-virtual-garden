import { createGarden } from "@/backend/repositories/garden/gardenRepository";
import { Garden } from "@/models/garden/Garden";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
	  const { plainGardenObject } = await request.json();
	  const result = await createGarden(userId, Garden.fromPlainObject(plainGardenObject));
	  return NextResponse.json(result, {status: 201});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }