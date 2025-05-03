import React from 'react';
import { addToGoogleWallet, addToAppleWallet } from '../utils/walletUtils';
import QRCode from 'qrcode.react';

const DigitalPass = ({ booking, user }) => {
    const generatePassData = () => {
        return {
            id: booking.id,
            eventName: 'TruckNest Parking',
            locationName: booking.parkingSpot.location,
            startDate: booking.startTime,
            endDate: booking.endTime,
            driverName: user.fullName,
            driverLicense: user.driverLicense,
            vehicleInfo: booking.vehicleDetails,
            qrCodeData: `${booking.id}-${user.id}-${Date.now()}`,
            bookingStatus: booking.status
        };
    };

    const handleAddToWallet = async (walletType) => {
        const passData = generatePassData();
        try {
            if (walletType === 'google') {
                await addToGoogleWallet(passData);
            } else {
                await addToAppleWallet(passData);
            }
        } catch (error) {
            console.error('Error adding to wallet:', error);
        }
    };

    return (
        <div className="digital-pass-container">
            <div className="pass-preview">
                <div className="pass-header">
                    <h3>TruckNest Parking Pass</h3>
                    <span className={`status-badge ${booking.status.toLowerCase()}`}>
                        {booking.status}
                    </span>
                </div>
                
                <div className="pass-details">
                    <div className="qr-section">
                        <QRCode 
                            value={`${booking.id}-${user.id}-${Date.now()}`}
                            size={150}
                            level="H"
                        />
                    </div>
                    
                    <div className="info-section">
                        <div className="info-row">
                            <label>Driver:</label>
                            <span>{user.fullName}</span>
                        </div>
                        <div className="info-row">
                            <label>License:</label>
                            <span>{user.driverLicense}</span>
                        </div>
                        <div className="info-row">
                            <label>Location:</label>
                            <span>{booking.parkingSpot.location}</span>
                        </div>
                        <div className="info-row">
                            <label>Spot:</label>
                            <span>{booking.parkingSpot.spotNumber}</span>
                        </div>
                        <div className="info-row">
                            <label>Check-in:</label>
                            <span>{new Date(booking.startTime).toLocaleString()}</span>
                        </div>
                        <div className="info-row">
                            <label>Check-out:</label>
                            <span>{new Date(booking.endTime).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="pass-actions">
                    <button 
                        className="wallet-button google"
                        onClick={() => handleAddToWallet('google')}
                    >
                        Add to Google Wallet
                    </button>
                    <button 
                        className="wallet-button apple"
                        onClick={() => handleAddToWallet('apple')}
                    >
                        Add to Apple Wallet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalPass; 