import { createPlot } from "@/backend/repositories/garden/plot/plotRepository";
import { Plot } from "@/models/garden/Plot";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { gardenId: string } }) {
	const { gardenId } = params;
	try {
	  const { rowIndex, columnIndex, plainPlotObject } = await request.json();
	  const result = await createPlot(gardenId, rowIndex, columnIndex, Plot.fromPlainObject(plainPlotObject));
	  return NextResponse.json(result, {status: 201});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }