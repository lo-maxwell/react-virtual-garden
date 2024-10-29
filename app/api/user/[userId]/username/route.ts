import { updateUserUsername } from "@/backend/services/user/userService";
import { NextResponse } from "@/node_modules/next/server";

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
	  const { newUsername } = await request.json();
	  const result = await updateUserUsername(userId, newUsername);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }