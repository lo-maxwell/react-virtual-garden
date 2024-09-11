import { createUser } from "@/backend/repositories/user/userRepository";
import User from "@/models/user/User";
import { NextResponse } from "@/node_modules/next/server";

export async function POST(request: Request) {
	try {
	  const { plainUserObject } = await request.json();
	  const result = await createUser(User.fromPlainObject(plainUserObject));
	  return NextResponse.json(result, {status: 201});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }