import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import VehicleDetailsForm from './VehicleDetailsForm';

const BookingForm = ({ userId, parkingSpotId, onBookingComplete }) => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({
        startDate: '',
        endDate: '',
        notes: ''
    });

    // Load user's vehicles
    useEffect(() => {
        loadVehicles();
    }, [userId]);

    const loadVehicles = async () => {
        try {
            const vehiclesQuery = query(
                collection(db, 'vehicles'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(vehiclesQuery);
            const vehiclesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setVehicles(vehiclesList);
            setLoading(false);
        } catch (err) {
            console.error('Error loading vehicles:', err);
            setError('Failed to load vehicles');
            setLoading(false);
        }
    };

    const handleAddVehicle = async (vehicleData) => {
        try {
            setLoading(true);
            const docRef = await addDoc(collection(db, 'vehicles'), {
                ...vehicleData,
                userId,
                createdAt: new Date().toISOString()
            });
            await loadVehicles();
            setShowAddVehicle(false);
            // Select the newly added vehicle
            setSelectedVehicle(docRef.id);
        } catch (err) {
            console.error('Error adding vehicle:', err);
            setError('Failed to add vehicle');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) {
            setError('Please select a vehicle');
            return;
        }

        try {
            setLoading(true);
            const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
            
            const booking = {
                userId,
                parkingSpotId,
                vehicleId: selectedVehicle,
                vehicleDetails: selectedVehicleData,
                startDate: bookingDetails.startDate,
                endDate: bookingDetails.endDate,
                notes: bookingDetails.notes,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'bookings'), booking);
            onBookingComplete();
        } catch (err) {
            console.error('Error creating booking:', err);
            setError('Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-4">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Book Parking Spot</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Vehicle
                    </label>
                    {vehicles.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {vehicles.map(vehicle => (
                                <label
                                    key={vehicle.id}
                                    className={`relative flex p-4 border rounded-lg cursor-pointer hover:border-blue-500 ${
                                        selectedVehicle === vehicle.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="vehicle"
                                        value={vehicle.id}
                                        checked={selectedVehicle === vehicle.id}
                                        onChange={(e) => setSelectedVehicle(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">
                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                        </h3>
                                        <p className="text-gray-600">
                                            {vehicle.type} • {vehicle.size} • License: {vehicle.licensePlate}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No vehicles registered yet.</p>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowAddVehicle(true)}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        + Register New Vehicle
                    </button>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Start Date*
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={bookingDetails.startDate}
                            onChange={(e) => setBookingDetails(prev => ({
                                ...prev,
                                startDate: e.target.value
                            }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            End Date*
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={bookingDetails.endDate}
                            onChange={(e) => setBookingDetails(prev => ({
                                ...prev,
                                endDate: e.target.value
                            }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Additional Notes
                    </label>
                    <textarea
                        value={bookingDetails.notes}
                        onChange={(e) => setBookingDetails(prev => ({
                            ...prev,
                            notes: e.target.value
                        }))}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Any special requirements or notes for your booking"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !selectedVehicle}
                        className={`px-4 py-2 rounded-md text-white ${
                            loading || !selectedVehicle
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                </div>
            </form>

            {/* Add Vehicle Modal */}
            {showAddVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Register New Vehicle</h3>
                            <button
                                onClick={() => setShowAddVehicle(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <VehicleDetailsForm onSubmit={handleAddVehicle} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingForm; 