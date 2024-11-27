const admin = require('firebase-admin');
const path = require('path');

const projectRoot = process.cwd();
const serviceAccountPath = path.resolve(projectRoot, 'secrets/firebase-service-account-file.json');
if (!admin.apps.length) {
	console.log('Firebase Admin initialized');
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccountPath),
	});
	} else {
	console.log('Firebase Admin already initialized');
}

// This function sets custom claims for the first user
const setFirstAdmin = async (email: string) => {
  try {
    // Fetch the user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Set custom claims to give the user the 'admin' role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    console.log(`Successfully set admin role for user: ${userRecord.email}`);
  } catch (error) {
    console.error('Error setting first admin:', error);
  }
};

// Call the function with the email of the first user you want to make admin
setFirstAdmin('admin@admin.com');