import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc, limit, arrayUnion } from 'firebase/firestore';
import StripeService from '../../services/StripeService';
import { useAuth } from '../../contexts/AuthContext'; // Assuming you have an auth context

const DisputeManager = () => {
    const [disputes, setDisputes] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resolution, setResolution] = useState({
        decision: '',
        notes: '',
        refundAmount: 0
    });

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        try {
            const disputesQuery = query(
                collection(db, 'disputes'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(disputesQuery);
            const disputesList = await Promise.all(snapshot.docs.map(async doc => {
                const data = { id: doc.id, ...doc.data() };
                // Fetch related booking and payment info
                const [bookingDoc, escrowDoc] = await Promise.all([
                    db.collection('bookings').doc(data.bookingId).get(),
                    db.collection('paymentEscrow').doc(data.escrowId).get()
                ]);
                return {
                    ...data,
                    booking: bookingDoc.exists ? bookingDoc.data() : null,
                    escrow: escrowDoc.exists ? escrowDoc.data() : null
                };
            }));
            setDisputes(disputesList);
            setLoading(false);
        } catch (err) {
            console.error('Error loading disputes:', err);
            setError('Failed to load disputes');
            setLoading(false);
        }
    };

    const handleResolveDispute = async (disputeId, resolution) => {
        try {
            setLoading(true);
            const dispute = disputes.find(d => d.id === disputeId);
            
            // Update dispute status
            await updateDoc(doc(db, 'disputes', disputeId), {
                status: 'resolved',
                resolution: {
                    ...resolution,
                    resolvedAt: new Date().toISOString(),
                    resolvedBy: auth.currentUser.uid
                },
                timeline: [...dispute.timeline, {
                    status: 'resolved',
                    timestamp: new Date().toISOString(),
                    details: `Dispute resolved with decision: ${resolution.decision}`
                }]
            });

            // Update escrow record
            await updateDoc(doc(db, 'paymentEscrow', dispute.escrowId), {
                disputeStatus: 'resolved',
                resolution: resolution,
                auditLog: [...dispute.escrow.auditLog, {
                    action: 'dispute_resolved',
                    timestamp: new Date().toISOString(),
                    details: `Dispute resolved: ${resolution.decision}`
                }]
            });

            // If refund is required
            if (resolution.decision === 'refund' && resolution.refundAmount > 0) {
                await handleRefund(dispute, resolution.refundAmount);
            }

            // Create admin action log
            await addDoc(collection(db, 'adminActions'), {
                type: 'dispute_resolution',
                disputeId,
                adminId: auth.currentUser.uid,
                action: resolution.decision,
                details: resolution,
                timestamp: new Date().toISOString()
            });

            await loadDisputes();
            setSelectedDispute(null);
            setResolution({ decision: '', notes: '', refundAmount: 0 });
        } catch (err) {
            console.error('Error resolving dispute:', err);
            setError('Failed to resolve dispute');
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (dispute, amount) => {
        try {
            const { currentUser } = useAuth();
            const idToken = await currentUser.getIdToken();

            // Create refund through Stripe service
            const refund = await StripeService.createRefund(
                dispute.escrow.paymentIntentId,
                amount,
                idToken
            );

            // Record refund in database
            await addDoc(collection(db, 'refunds'), {
                disputeId: dispute.id,
                escrowId: dispute.escrowId,
                amount,
                refundId: refund.id,
                status: 'completed',
                createdAt: new Date().toISOString(),
                processedBy: currentUser.uid,
                stripeRefundData: {
                    id: refund.id,
                    status: refund.status,
                    amount: refund.amount,
                    currency: refund.currency,
                    payment_intent: refund.payment_intent
                }
            });

            // Update payment tracking
            const trackingRef = await getDocs(
                query(
                    collection(db, 'paymentTracking'),
                    where('transactionId', '==', dispute.escrow.transactionId),
                    limit(1)
                )
            );

            if (!trackingRef.empty) {
                await updateDoc(trackingRef.docs[0].ref, {
                    status: 'refunded',
                    timeline: arrayUnion({
                        status: 'refunded',
                        timestamp: new Date().toISOString(),
                        details: `Refund processed: $${amount}`,
                        refundId: refund.id
                    })
                });
            }

            // Update dispute status
            await updateDoc(doc(db, 'disputes', dispute.id), {
                'resolution.refundProcessed': true,
                'resolution.refundId': refund.id,
                'resolution.refundAmount': amount,
                'resolution.refundStatus': refund.status,
                timeline: arrayUnion({
                    status: 'refund_processed',
                    timestamp: new Date().toISOString(),
                    details: `Refund processed successfully: $${amount}`
                })
            });

        } catch (error) {
            console.error('Error processing refund:', error);
            throw new Error(`Refund processing failed: ${error.message}`);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-4">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Payment Disputes</h2>
                <div className="flex gap-2">
                    <select
                        className="rounded-md border-gray-300"
                        onChange={(e) => {
                            const filtered = query(
                                collection(db, 'disputes'),
                                where('status', '==', e.target.value),
                                orderBy('createdAt', 'desc')
                            );
                            loadDisputes(filtered);
                        }}
                    >
                        <option value="all">All Disputes</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    {error}
                </div>
            )}

            {/* Disputes List */}
            <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                    {disputes.map(dispute => (
                        <li
                            key={dispute.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedDispute(dispute)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Dispute #{dispute.id.slice(0, 8)}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Booking #{dispute.bookingId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Amount: ${dispute.amount}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                                        ${dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                        {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Dispute Details Modal */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                Dispute Details #{selectedDispute.id.slice(0, 8)}
                            </h3>
                            <button
                                onClick={() => setSelectedDispute(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Dispute Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium">Dispute Details</h4>
                                    <p className="text-sm text-gray-600">
                                        Created: {new Date(selectedDispute.createdAt).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Status: {selectedDispute.status}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Amount: ${selectedDispute.amount}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium">Booking Information</h4>
                                    <p className="text-sm text-gray-600">
                                        Booking ID: {selectedDispute.bookingId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Customer ID: {selectedDispute.customerId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Landowner ID: {selectedDispute.landownerId}
                                    </p>
                                </div>
                            </div>

                            {/* Dispute Description */}
                            <div>
                                <h4 className="font-medium">Description</h4>
                                <p className="text-gray-600">{selectedDispute.details}</p>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h4 className="font-medium">Timeline</h4>
                                <div className="space-y-2 mt-2">
                                    {selectedDispute.timeline.map((event, index) => (
                                        <div key={index} className="flex gap-2 text-sm">
                                            <span className="text-gray-500">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </span>
                                            <span className="text-gray-700">{event.details}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resolution Form */}
                            {selectedDispute.status === 'pending' && (
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="font-medium mb-2">Resolve Dispute</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Decision
                                            </label>
                                            <select
                                                value={resolution.decision}
                                                onChange={(e) => setResolution({
                                                    ...resolution,
                                                    decision: e.target.value
                                                })}
                                                className="mt-1 block w-full rounded-md border-gray-300"
                                            >
                                                <option value="">Select Decision</option>
                                                <option value="approve">Release Payment</option>
                                                <option value="refund">Process Refund</option>
                                                <option value="partial_refund">Partial Refund</option>
                                            </select>
                                        </div>

                                        {resolution.decision.includes('refund') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Refund Amount
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">$</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={resolution.refundAmount}
                                                        onChange={(e) => setResolution({
                                                            ...resolution,
                                                            refundAmount: parseFloat(e.target.value)
                                                        })}
                                                        className="pl-7 block w-full rounded-md border-gray-300"
                                                        max={selectedDispute.amount}
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Maximum refund amount: ${selectedDispute.amount}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Resolution Notes
                                            </label>
                                            <textarea
                                                value={resolution.notes}
                                                onChange={(e) => setResolution({
                                                    ...resolution,
                                                    notes: e.target.value
                                                })}
                                                rows="3"
                                                className="mt-1 block w-full rounded-md border-gray-300"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedDispute(null)}
                                                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleResolveDispute(selectedDispute.id, resolution)}
                                                disabled={!resolution.decision || loading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                            >
                                                {loading ? 'Processing...' : 'Resolve Dispute'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisputeManager; 