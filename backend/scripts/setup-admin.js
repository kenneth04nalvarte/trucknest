const admin = require('firebase-admin');
const path = require('path');

// Get the absolute path to the service account key
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
console.log('Loading service account from:', serviceAccountPath);

try {
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  console.log('Project ID:', serviceAccount.project_id);

  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error loading service account:', error);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  try {
    console.log('Starting admin user creation...');

    // Admin user details
    const email = 'admin@trucknest.com';
    const password = 'TruckNest@2024';
    const displayName = 'TruckNest Admin';

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log('User already exists:', existingUser.uid);
      
      // Update user claims
      await auth.setCustomUserClaims(existingUser.uid, { admin: true });
      console.log('Updated admin claims for existing user');

      // Create users collection if it doesn't exist (this is a no-op if it exists)
      const usersCollectionRef = db.collection('users');
      
      // Create or update admin document
      const userDocRef = usersCollectionRef.doc(existingUser.uid);
      await userDocRef.set({
        email,
        displayName,
        role: 'admin',
        roles: ['admin'],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      }, { merge: true });

      console.log('Updated admin user document in Firestore');
      process.exit(0);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('Creating new admin user...');
        
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true
        });
        console.log('Created user in Firebase Auth:', userRecord.uid);

        // Set admin claim
        await auth.setCustomUserClaims(userRecord.uid, { admin: true });
        console.log('Set admin claims for new user');

        // Create users collection if it doesn't exist (this is a no-op if it exists)
        const usersCollectionRef = db.collection('users');
        
        // Create admin document
        const userDocRef = usersCollectionRef.doc(userRecord.uid);
        await userDocRef.set({
          email,
          displayName,
          role: 'admin',
          roles: ['admin'],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        });

        console.log('Created admin document in Firestore');
        console.log('Admin user created successfully:', userRecord.uid);
        process.exit(0);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser(); 