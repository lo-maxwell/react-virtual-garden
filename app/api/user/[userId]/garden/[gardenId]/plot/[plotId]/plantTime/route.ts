import { setPlotPlantTime } from "@/backend/repositories/garden/plot/plotRepository";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { plotId: string } }) {
	const { plotId } = params;
	try {
	  const { newPlantTime } = await request.json();
	  const result = await setPlotPlantTime(plotId, newPlantTime);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }