import { updateIconWithLambda } from "@/backend/services/user/userService";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";


export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  
  try {
    // Keep Firebase authentication
    const decodedToken = await verifyToken(request.headers.get('Authorization'));
    const firebaseUid = decodedToken.uid;
	const { newIcon } = await request.json();

    // Use repository instead of direct Lambda call
    const user = await updateIconWithLambda(firebaseUid, newIcon);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message }, 
      { status: 500 }
    );
  }
}