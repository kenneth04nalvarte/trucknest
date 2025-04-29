const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

// Check for expiring IDs daily
exports.checkExpiringIDs = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
    try {
        const db = admin.firestore();
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        // Query users with ID expiration dates within 30 days
        const usersSnapshot = await db.collection('users')
            .where('userType', '==', 'trucker')
            .where('idVerification.expirationDate', '<=', thirtyDaysFromNow.toISOString())
            .where('idVerification.expirationDate', '>', now.toISOString())
            .get();

        const batch = db.batch();
        const notifications = [];

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const expirationDate = new Date(userData.idVerification.expirationDate);
            const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

            // Create notification
            const notificationRef = db.collection('notifications').doc();
            notifications.push({
                ref: notificationRef,
                notification: {
                    userId: doc.id,
                    type: 'id_expiration',
                    message: `Your CDL will expire in ${daysUntilExpiration} days. Please upload a new one.`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false
                }
            });

            // Send email notification (if email service is configured)
            if (userData.email) {
                // Implement email sending logic here
            }
        });

        // Save all notifications in a batch
        notifications.forEach(({ ref, notification }) => {
            batch.set(ref, notification);
        });

        await batch.commit();
        console.log(`Processed ${notifications.length} expiring IDs`);
        return null;
    } catch (error) {
        console.error('Error checking expiring IDs:', error);
        return null;
    }
});

// Verify ID upload and update user status
exports.verifyIDUpload = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        const userId = context.params.userId;

        // Check if this is a new ID verification submission
        if (newData.idVerification && 
            (!oldData.idVerification || 
             newData.idVerification.photoUrl !== oldData.idVerification?.photoUrl)) {
            
            try {
                const db = admin.firestore();
                const userRef = db.collection('users').doc(userId);

                // In a real application, you might want to implement manual verification
                // For now, we'll auto-verify if expiration date is valid
                const expirationDate = new Date(newData.idVerification.expirationDate);
                const now = new Date();

                if (expirationDate > now) {
                    await userRef.update({
                        'idVerification.status': 'verified',
                        'idVerification.verifiedAt': admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Create success notification
                    await db.collection('notifications').add({
                        userId: userId,
                        type: 'id_verified',
                        message: 'Your ID has been verified successfully.',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false
                    });
                } else {
                    await userRef.update({
                        'idVerification.status': 'rejected',
                        'idVerification.rejectionReason': 'ID is expired'
                    });

                    // Create rejection notification
                    await db.collection('notifications').add({
                        userId: userId,
                        type: 'id_rejected',
                        message: 'Your ID verification was rejected because the ID is expired.',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false
                    });
                }
            } catch (error) {
                console.error('Error processing ID verification:', error);
            }
        }
        return null;
    }); 