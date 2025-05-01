import { createUserProfile } from '../../../lib/schema';
import { auth } from '../../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, userData, role } = req.body;

    // Verify the Firebase ID token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Create user profile
    await createUserProfile(userId, userData, role);

    return res.status(200).json({ message: 'User profile created successfully' });
  } catch (error) {
    console.error('Error in register API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 