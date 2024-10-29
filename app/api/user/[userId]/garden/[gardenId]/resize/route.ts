
import { addGardenColumn, addGardenRow, removeGardenColumn, removeGardenRow } from "@/backend/services/garden/gardenService";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string, gardenId: string } }) {
	const { userId, gardenId } = params;
	try {
	  const { axis, expand } = await request.json();
	  // Input validation
		if (!['row', 'column'].includes(axis)) {
			throw new Error(`Invalid axis: ${axis}`);
		}
		if (typeof expand !== 'boolean') {
			throw new Error(`Invalid expand value: ${expand}`);
		}
	  const combinedParams = `${axis} : ${expand}`;
	  let result;
	  switch (combinedParams) {
		case 'row : true':
			result = await addGardenRow(userId, gardenId);
			break;
		case 'row : false':
			result = await removeGardenRow(userId, gardenId);
			break;
		case 'column : true':
			result = await addGardenColumn(userId, gardenId);
			break;
		case 'column : false':
			result = await removeGardenColumn(userId, gardenId);
			break;
		default:
			throw new Error(`Invalid input to garden resize: axis = ${axis}, expand = ${expand}`);
	  }
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }