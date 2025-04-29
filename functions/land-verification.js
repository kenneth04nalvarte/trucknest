const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

exports.verifyLandOwnership = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        const userId = context.params.userId;

        // Check if this is a new land verification submission
        if (newData.landVerification && 
            (!oldData.landVerification || 
             newData.landVerification.submittedAt !== oldData.landVerification?.submittedAt)) {
            
            try {
                const db = admin.firestore();
                const userRef = db.collection('users').doc(userId);

                // In a production environment, this would typically trigger a manual review process
                // For now, we'll implement basic automated checks

                const verification = newData.landVerification;
                let isValid = true;
                let rejectionReasons = [];

                // Check for required files
                if (!verification.photos || verification.photos.length === 0) {
                    isValid = false;
                    rejectionReasons.push('Property photos are missing');
                }

                if (!verification.video) {
                    isValid = false;
                    rejectionReasons.push('Property video is missing');
                }

                if (!verification.utilityBill && !verification.mortgageStatement) {
                    isValid = false;
                    rejectionReasons.push('Utility bill or mortgage statement is required');
                }

                // Additional checks for business accounts
                if (verification.isBusinessAccount && (!verification.businessDocs || verification.businessDocs.length === 0)) {
                    isValid = false;
                    rejectionReasons.push('Business documentation is required');
                }

                // Update verification status
                if (isValid) {
                    await userRef.update({
                        'landVerification.status': 'verified',
                        'landVerification.verifiedAt': admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Create success notification
                    await db.collection('notifications').add({
                        userId: userId,
                        type: 'land_verified',
                        message: 'Your land ownership verification has been approved.',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false
                    });

                    // Update user permissions
                    await userRef.update({
                        roles: admin.firestore.FieldValue.arrayUnion('verified_land_owner'),
                        verificationStatus: 'verified'
                    });
                } else {
                    await userRef.update({
                        'landVerification.status': 'rejected',
                        'landVerification.rejectionReason': rejectionReasons.join(', '),
                        'landVerification.rejectedAt': admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Create rejection notification
                    await db.collection('notifications').add({
                        userId: userId,
                        type: 'land_rejected',
                        message: `Your land ownership verification was rejected. Reasons: ${rejectionReasons.join(', ')}`,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false
                    });
                }

                // Log verification attempt
                await db.collection('verificationLogs').add({
                    userId: userId,
                    type: 'land_ownership',
                    status: isValid ? 'verified' : 'rejected',
                    reasons: rejectionReasons,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    verificationData: {
                        hasPhotos: !!verification.photos,
                        hasVideo: !!verification.video,
                        hasUtilityBill: !!verification.utilityBill,
                        hasMortgageStatement: !!verification.mortgageStatement,
                        isBusinessAccount: verification.isBusinessAccount,
                        hasBusinessDocs: !!verification.businessDocs
                    }
                });

            } catch (error) {
                console.error('Error processing land verification:', error);
                
                // Create error notification
                const db = admin.firestore();
                await db.collection('notifications').add({
                    userId: userId,
                    type: 'verification_error',
                    message: 'There was an error processing your land verification. Please try again or contact support.',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
            }
        }
        return null;
    }); 