import { auth, db, storage, analytics } from './firebase';

// Test Firebase Authentication
console.log('Auth initialized:', auth !== null);

// Test Firestore
console.log('Firestore initialized:', db !== null);

// Test Storage
console.log('Storage initialized:', storage !== null);

// Test Analytics (will be null on server-side)
console.log('Analytics available:', analytics !== null);

// Test basic Firestore query
const testFirestore = async () => {
  try {
    const testCollection = db.collection('test');
    console.log('Firestore collection reference created successfully');
  } catch (error) {
    console.error('Firestore test failed:', error);
  }
};

testFirestore(); 