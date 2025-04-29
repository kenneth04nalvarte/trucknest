const admin = require('firebase-admin');

// Verify Firebase ID token
const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Check if user has admin role
const checkAdminRole = async (req, res, next) => {
    try {
        // First verify the token
        await verifyAuth(req, res, async () => {
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(req.user.uid).get();
            
            if (!userDoc.exists) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userData = userDoc.data();
            if (!userData.roles || !userData.roles.includes('admin')) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            next();
        });
    } catch (error) {
        console.error('Error checking admin role:', error);
        res.status(500).json({ message: 'Error checking permissions' });
    }
};

module.exports = {
    verifyAuth,
    checkAdminRole
}; 