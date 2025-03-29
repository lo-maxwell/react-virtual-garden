import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
import { getUserFromDatabaseWithLambda } from "@/backend/services/user/userService";


export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  
  try {
    // Keep Firebase authentication
    const decodedToken = await verifyToken(request.headers.get('Authorization'));
    const firebaseUid = decodedToken.uid;

    // Use repository instead of direct Lambda call
    const user = await getUserFromDatabaseWithLambda(firebaseUid);
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