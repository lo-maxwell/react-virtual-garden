import { setAdmin } from "@/backend/services/admin/adminService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		if (decodedToken.role !== 'admin') {
			throw new Error('Forbidden: Admins only');
		  }
	  const {targetEmail} = await request.json();
	  const result = await setAdmin(firebaseUid, targetEmail);
	  return NextResponse.json(result, {status: 200});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }