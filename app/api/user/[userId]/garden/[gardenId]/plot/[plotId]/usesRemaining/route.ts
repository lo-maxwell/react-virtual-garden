import { setPlotUsesRemaining, updatePlotUsesRemaining } from "@/backend/repositories/garden/plot/plotRepository";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { plotId: string } }) {
	const { plotId } = params;
	try {
	  const { newUsesRemaining } = await request.json();
	  const result = await setPlotUsesRemaining(plotId, newUsesRemaining);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }

export async function PATCH(request: Request, { params }: { params: { plotId: string } }) {
	const { plotId } = params;
	try {
		const { usesDelta } = await request.json();
		const result = await updatePlotUsesRemaining(plotId, usesDelta);
		return NextResponse.json(result, {status: 200});
	} catch (error) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}