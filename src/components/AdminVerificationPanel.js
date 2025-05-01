import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';

const AdminVerificationPanel = () => {
    const [verifications, setVerifications] = useState([]);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, verified, rejected

    useEffect(() => {
        loadVerifications();
    }, [filter]);

    const loadVerifications = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'users'),
                where('landVerification.status', '==', filter),
                orderBy('landVerification.submittedAt', 'desc')
            );
            
            const snapshot = await getDocs(q);
            const verificationData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setVerifications(verificationData);
        } catch (error) {
            console.error('Error loading verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationAction = async (userId, action, reason = '') => {
        try {
            const userRef = doc(db, 'users', userId);
            const status = action === 'approve' ? 'verified' : 'rejected';
            
            await updateDoc(userRef, {
                'landVerification.status': status,
                'landVerification.reviewedAt': new Date().toISOString(),
                ...(action === 'reject' && { 'landVerification.rejectionReason': reason }),
                ...(action === 'approve' && { roles: ['verified_land_owner'] })
            });

            // Create notification
            await addDoc(collection(db, 'notifications'), {
                userId,
                type: `land_${status}`,
                message: action === 'approve' 
                    ? 'Your land ownership verification has been approved.'
                    : `Your land ownership verification was rejected. Reason: ${reason}`,
                createdAt: new Date().toISOString(),
                read: false
            });

            // Refresh the list
            loadVerifications();
            setSelectedVerification(null);
        } catch (error) {
            console.error('Error updating verification:', error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Verification List */}
            <div className="w-1/3 bg-white p-6 overflow-y-auto border-r">
                <h2 className="text-2xl font-bold mb-6">Land Verifications</h2>
                
                {/* Filter Controls */}
                <div className="flex space-x-2 mb-6">
                    {['pending', 'verified', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg capitalize ${
                                filter === status
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {verifications.map(verification => (
                            <div
                                key={verification.id}
                                onClick={() => setSelectedVerification(verification)}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    selectedVerification?.id === verification.id
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'hover:bg-gray-50 border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">
                                            {verification.isBusinessAccount ? 'Business' : 'Individual'} Account
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Submitted: {new Date(verification.landVerification.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                        verification.landVerification.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : verification.landVerification.status === 'verified'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {verification.landVerification.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Verification Details */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedVerification ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold">Verification Details</h2>
                            {selectedVerification.landVerification.status === 'pending' && (
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleVerificationAction(selectedVerification.id, 'approve')}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            const reason = prompt('Please enter rejection reason:');
                                            if (reason) {
                                                handleVerificationAction(selectedVerification.id, 'reject', reason);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Property Photos */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Property Photos</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {selectedVerification.landVerification.photos.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo}
                                        alt={`Property photo ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Property Video */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Property Video</h3>
                            <video
                                src={selectedVerification.landVerification.video}
                                controls
                                className="w-full rounded-lg"
                            />
                        </div>

                        {/* Documents */}
                        <div className="grid grid-cols-2 gap-6">
                            {selectedVerification.landVerification.utilityBill && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Utility Bill</h3>
                                    <a
                                        href={selectedVerification.landVerification.utilityBill}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                                    >
                                        View Utility Bill
                                    </a>
                                </div>
                            )}

                            {selectedVerification.landVerification.mortgageStatement && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Mortgage Statement</h3>
                                    <a
                                        href={selectedVerification.landVerification.mortgageStatement}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                                    >
                                        View Mortgage Statement
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Business Documents */}
                        {selectedVerification.landVerification.isBusinessAccount && (
                            <div className="space-y-2">
                                <h3 className="font-semibold">Business Documents</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedVerification.landVerification.businessDocs.map((doc, index) => (
                                        <a
                                            key={index}
                                            href={doc}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                                        >
                                            View Business Document {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Verification History */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Verification History</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p>Submitted: {new Date(selectedVerification.landVerification.submittedAt).toLocaleString()}</p>
                                {selectedVerification.landVerification.reviewedAt && (
                                    <p>Reviewed: {new Date(selectedVerification.landVerification.reviewedAt).toLocaleString()}</p>
                                )}
                                {selectedVerification.landVerification.rejectionReason && (
                                    <p className="text-red-600">
                                        Rejection Reason: {selectedVerification.landVerification.rejectionReason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-full text-gray-500">
                        Select a verification to review
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminVerificationPanel; 