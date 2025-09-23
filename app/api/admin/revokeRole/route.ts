import { revokeAdmin } from "@/backend/services/admin/adminService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { ApiResponse } from "@/utils/api/apiResponse";

export async function PATCH(request: Request) {
	try {
		// Verify the token using Firebase Admin SDK
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		if (decodedToken.role !== 'admin') {
			return NextResponse.json({ success: false, error: { code: ApiErrorCodes.FORBIDDEN, message: "Forbidden: Admins only" } }, { status: 403 });
		  }
		const {targetEmail} = await request.json();
		const result = await revokeAdmin(firebaseUid, targetEmail);
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }