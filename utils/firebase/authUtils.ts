import { firebaseAdmin } from "@/backend/firebase/firebaseAdmin";
import { mapFirebaseError } from "../api/error/firebaseErrorMapper";
import { BadRequestError } from "../errors";

export async function verifyToken(authorizationHeader: string | null) {
  if (!firebaseAdmin) {
    throw new BadRequestError("Firebase admin is not configured");
  }

  if (!authorizationHeader) {
    throw new BadRequestError("Authorization header is missing");
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    throw new BadRequestError("No token provided");
  }

  try {
    return await firebaseAdmin.auth().verifyIdToken(token);
  } catch (err: any) {
    throw mapFirebaseError(err); // cleaner than always BadRequest
  }
}
