import { updateUserIcon } from "@/backend/services/user/userService";
import { NextResponse } from "@/node_modules/next/server";
import { verifyToken } from "@/utils/firebase/authUtils";

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
	const { userId } = params;
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
	  const { newIcon } = await request.json();
	  const result = await updateUserIcon(firebaseUid, newIcon);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }