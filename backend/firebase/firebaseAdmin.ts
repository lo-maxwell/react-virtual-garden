import admin from 'firebase-admin';
import * as path from 'path';
//TODO: Figure out why this is always already initialized
//

// Initialize the Firebase Admin SDK (only once)
if (typeof window === 'undefined') {
  const projectRoot = process.cwd();
  const serviceAccountPath = path.resolve(projectRoot, 'secrets/firebase-service-account-file.json');
  if (!admin.apps.length) {
    console.log('Firebase Admin initialized');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
  } else {
    console.log('Firebase Admin already initialized');
    // admin.apps.forEach((app) => {
    //   if (app) app.delete();
    //   console.log('Deleted existing Firebase Admin app');
    // });
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccountPath),
    // });
  }
}
// Rename the default export to 'firebaseAdmin'
export const firebaseAdmin = admin;
