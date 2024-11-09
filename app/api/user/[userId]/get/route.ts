import { getUserFromDatabase } from "@/backend/services/user/userService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	//   const {} = await request.json();
	  const result = await getUserFromDatabase(firebaseUid);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }