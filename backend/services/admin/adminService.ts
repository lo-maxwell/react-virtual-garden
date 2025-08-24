import admin from 'firebase-admin';

/**
 * Sets a user as admin. Only callable by an existing admin.
 * @param callerUid UID of the user making the request (must be admin)
 * @param targetEmail Email of the user to make admin
 */
export async function setAdmin (callerUid: string, targetEmail: string): Promise<{success: boolean, message?: string, error?: string}> {
  try {
    // Verify the caller's role
    const callerUser = await admin.auth().getUser(callerUid);
    if (callerUser.customClaims?.role !== 'admin') {
      throw new Error('Unauthorized: only admins can set other admins.');
    }

    // Fetch the target user by email
    const targetUser = await admin.auth().getUserByEmail(targetEmail);

    // Set custom claims to give the target user the 'admin' role
    await admin.auth().setCustomUserClaims(targetUser.uid, { role: 'admin' });

    return {
      success: true,
      message: `Successfully set admin role for user: ${targetUser.email}`,
    };
  } catch (error) {
    console.error('Error setting admin:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Revokes admin role from a user. Only callable by an existing admin.
 * @param callerUid UID of the user making the request (must be admin)
 * @param targetEmail Email of the user to revoke admin role from
 */
 export async function revokeAdmin (callerUid: string, targetEmail: string): Promise<{success: boolean, message?: string, error?: string}> {
  try {
    // Verify the caller's role
    const callerUser = await admin.auth().getUser(callerUid);
    if (callerUser.customClaims?.role !== 'admin') {
      throw new Error('Unauthorized: only admins can revoke admin roles.');
    }

    // Fetch the target user by email
    const targetUser = await admin.auth().getUserByEmail(targetEmail);

	// Prevent self-revocation
    if (targetUser.uid === callerUid) {
		throw new Error('Admins cannot revoke their own admin role.');
	  }

    // Remove admin role by setting role to null or removing custom claims
    await admin.auth().setCustomUserClaims(targetUser.uid, { role: null });

    return {
      success: true,
      message: `Successfully revoked admin role for user: ${targetUser.email}`,
    };
  } catch (error) {
    console.error('Error revoking admin:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};
