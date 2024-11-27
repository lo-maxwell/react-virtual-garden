import { InternalServerError } from "@/utils/errors";
import { firebaseAdmin } from "../firebaseAdmin";

/**
 * Run on server after registering a user to link to database and assign roles
 * @param firebaseUid 
 */
export const setDefaultCustomClaims = async (firebaseUid: string): Promise<void> => {
    try {
        // Set the custom claims, including the user ID and role
        await firebaseAdmin.auth().setCustomUserClaims(firebaseUid, { 
            role: 'DEFAULT_ROLE'
        });
        console.log(`Custom claims set for user ${firebaseUid}:`, { role: 'DEFAULT_ROLE' });
    } catch (error) {
        console.error("Error setting custom claims:", error);
        throw new InternalServerError('Failed to set custom claims');
    }
};