const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { checkAdminRole } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(checkAdminRole);

// Get verification list
router.get('/verifications', async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const db = admin.firestore();
        
        const verificationQuery = await db.collection('users')
            .where('landVerification.status', '==', status)
            .orderBy('landVerification.submittedAt', 'desc')
            .get();

        const verifications = verificationQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(verifications);
    } catch (error) {
        console.error('Error fetching verifications:', error);
        res.status(500).json({ message: 'Error fetching verifications' });
    }
});

// Get verification details
router.get('/verifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = admin.firestore();
        
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: userDoc.id,
            ...userDoc.data()
        });
    } catch (error) {
        console.error('Error fetching verification details:', error);
        res.status(500).json({ message: 'Error fetching verification details' });
    }
});

// Update verification status
router.post('/verifications/:userId/review', async (req, res) => {
    try {
        const { userId } = req.params;
        const { action, reason } = req.body;
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const batch = db.batch();
        const status = action === 'approve' ? 'verified' : 'rejected';

        // Update user document
        batch.update(userRef, {
            'landVerification.status': status,
            'landVerification.reviewedAt': admin.firestore.FieldValue.serverTimestamp(),
            ...(action === 'reject' && { 'landVerification.rejectionReason': reason }),
            ...(action === 'approve' && { 
                roles: admin.firestore.FieldValue.arrayUnion('verified_land_owner'),
                verificationStatus: 'verified'
            })
        });

        // Create notification
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
            userId,
            type: `land_${status}`,
            message: action === 'approve'
                ? 'Your land ownership verification has been approved.'
                : `Your land ownership verification was rejected. Reason: ${reason}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        });

        // Create verification log
        const logRef = db.collection('verificationLogs').doc();
        batch.set(logRef, {
            userId,
            type: 'land_ownership',
            status,
            reviewedBy: req.user.uid, // From auth middleware
            reason: action === 'reject' ? reason : null,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();
        res.json({ message: `Verification ${status} successfully` });
    } catch (error) {
        console.error('Error updating verification:', error);
        res.status(500).json({ message: 'Error updating verification' });
    }
});

// Get verification logs
router.get('/verification-logs', async (req, res) => {
    try {
        const { userId } = req.query;
        const db = admin.firestore();
        
        let query = db.collection('verificationLogs')
            .orderBy('timestamp', 'desc')
            .limit(100);

        if (userId) {
            query = query.where('userId', '==', userId);
        }

        const logsSnapshot = await query.get();
        const logs = logsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
        }));

        res.json(logs);
    } catch (error) {
        console.error('Error fetching verification logs:', error);
        res.status(500).json({ message: 'Error fetching verification logs' });
    }
});

module.exports = router; 