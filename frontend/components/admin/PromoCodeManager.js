import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { functions as firebaseFunctions } from '../../firebase';
import '../../styles/promo-code-manager.css';

const PromoCodeManager = () => {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage', // or 'fixed'
        discountValue: '',
        startDate: '',
        endDate: '',
        usageLimit: '',
        minBookingAmount: '',
        maxDiscount: '',
        oneTimeUse: false,
        description: ''
    });

    const functions = getFunctions();
    const db = getFirestore();

    // Load promo codes
    useEffect(() => {
        const q = query(collection(db, 'promoCodes'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const promos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPromoCodes(promos);
        });

        return () => unsubscribe();
    }, []);

    // Create promo code
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const createPromoCode = httpsCallable(functions, 'createPromoCode');
            await createPromoCode({
                ...formData,
                discountValue: Number(formData.discountValue),
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
                minBookingAmount: formData.minBookingAmount ? Number(formData.minBookingAmount) : null,
                maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null
            });

            // Reset form
            setFormData({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                startDate: '',
                endDate: '',
                usageLimit: '',
                minBookingAmount: '',
                maxDiscount: '',
                oneTimeUse: false,
                description: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // View analytics
    const viewAnalytics = async (promoCode) => {
        setSelectedPromo(promoCode);
        setLoading(true);
        setError(null);

        try {
            const getPromoAnalytics = httpsCallable(functions, 'getPromoAnalytics');
            const result = await getPromoAnalytics({ promoCode: promoCode.code });
            setAnalytics(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="promo-code-manager">
            <h2>Promo Code Manager</h2>
            
            {/* Create Promo Form */}
            <div className="card mb-4">
                <div className="card-body">
                    <h3>Create New Promo Code</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                    required
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label>Discount Type</label>
                                <select
                                    className="form-control"
                                    value={formData.discountType}
                                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                                    required
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label>Discount Value</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Start Date</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>End Date</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label>Usage Limit</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Min Booking Amount</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.minBookingAmount}
                                    onChange={(e) => setFormData({...formData, minBookingAmount: e.target.value})}
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label>Max Discount</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.maxDiscount}
                                    onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label>Description</label>
                            <textarea
                                className="form-control"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-check-label">
                                <input
                                    type="checkbox"
                                    className="form-check-input me-2"
                                    checked={formData.oneTimeUse}
                                    onChange={(e) => setFormData({...formData, oneTimeUse: e.target.checked})}
                                />
                                One-time use only
                            </label>
                        </div>

                        {error && <div className="alert alert-danger">{error}</div>}
                        
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Promo Code'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Promo Codes List */}
            <div className="card">
                <div className="card-body">
                    <h3>Active Promo Codes</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Valid Until</th>
                                    <th>Usage</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promoCodes.map(promo => (
                                    <tr key={promo.id}>
                                        <td>{promo.code}</td>
                                        <td>
                                            {promo.discountType === 'percentage' 
                                                ? `${promo.discountValue}%` 
                                                : `$${promo.discountValue}`}
                                        </td>
                                        <td>{format(promo.endDate.toDate(), 'MMM dd, yyyy')}</td>
                                        <td>
                                            {promo.usedCount}
                                            {promo.usageLimit && ` / ${promo.usageLimit}`}
                                        </td>
                                        <td>
                                            <span className={`badge ${promo.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                {promo.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-info"
                                                onClick={() => viewAnalytics(promo)}
                                            >
                                                Analytics
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Analytics Modal */}
            {selectedPromo && analytics && (
                <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Analytics for {selectedPromo.code}</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => {
                                        setSelectedPromo(null);
                                        setAnalytics(null);
                                    }}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6>Total Usage</h6>
                                                <h3>{analytics.analytics.totalUsage}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6>Total Discount</h6>
                                                <h3>${analytics.analytics.totalDiscount.toFixed(2)}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6>Unique Users</h6>
                                                <h3>{analytics.analytics.uniqueUsers}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h5 className="mt-4">Usage History</h5>
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>User</th>
                                                <th>Booking</th>
                                                <th>Discount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.analytics.usageHistory.map((usage, index) => (
                                                <tr key={index}>
                                                    <td>{format(usage.usedAt.toDate(), 'MMM dd, yyyy HH:mm')}</td>
                                                    <td>{usage.userId}</td>
                                                    <td>{usage.bookingId}</td>
                                                    <td>${usage.discountAmount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromoCodeManager; 