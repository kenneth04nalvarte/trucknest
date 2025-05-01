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
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error loading service account:', error);
  process.exit(1);
}

async function createAdminDocument() {
  try {
    const adminUid = 'VVTGw87aHTS7dvizCEsIhiL4sRk2';
    
    // Get an auth token
    const token = await admin.auth().createCustomToken(adminUid);
    console.log('Created custom token for admin');

    // Create the document data
    const adminData = {
      fields: {
        email: { stringValue: 'admin@trucknest.com' },
        displayName: { stringValue: 'TruckNest Admin' },
        role: { stringValue: 'admin' },
        roles: { arrayValue: { values: [{ stringValue: 'admin' }] } },
        status: { stringValue: 'active' },
        createdAt: { timestampValue: new Date().toISOString() },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    };

    // Get the project ID from the service account
    const projectId = admin.app().options.projectId;
    console.log('Project ID:', projectId);

    // Create document using REST API
    const accessToken = await admin.app().options.credential.getAccessToken();
    console.log('Got access token');

    const https = require('https');
    const documentPath = `projects/${projectId}/databases/(default)/documents/users/${adminUid}`;
    
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/${documentPath}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken.access_token}`,
        'Content-Type': 'application/json',
      }
    };

    console.log('Sending request to Firestore...');
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('Successfully created admin document in Firestore');
            resolve();
          } else {
            console.error('Error response:', data);
            reject(new Error(`Failed to create document: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });

      req.write(JSON.stringify(adminData));
      req.end();
    });
  } catch (error) {
    console.error('Error creating admin document:', error);
    process.exit(1);
  }
}

createAdminDocument()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 