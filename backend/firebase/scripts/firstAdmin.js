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

const setUserRole = async (email, role) => {
  const userRecord = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(userRecord.uid, { role });
  console.log(`✅ ${email} is now ${role}`);
};

// Call the function with the email of the first user you want to make admin
const run = async () => {
  await setUserRole('admin@admin.com', 'admin');
  process.exit(0); // exit when done
};

run();