// utils/authUtils.ts
import { firebaseAdmin } from "@/backend/firebase/firebaseAdmin";
import { BadRequestError } from "../errors";

export async function verifyToken(authorizationHeader: string | null) {
	if (!authorizationHeader) {
        throw new BadRequestError('Authorization header is missing');
    }
    const token = authorizationHeader?.split(' ')[1];
    if (!token) {
        throw new BadRequestError('No token provided');
    }
	try {
		return await firebaseAdmin.auth().verifyIdToken(token);
	} catch (error) {
		throw new BadRequestError('Invalid or expired token');
	}
}