import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import VehicleDetailsForm from './VehicleDetailsForm';

const VehicleManagement = ({ userId }) => {
    const [vehicles, setVehicles] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            await addDoc(collection(db, 'vehicles'), {
                ...vehicleData,
                userId,
                createdAt: new Date().toISOString()
            });
            await loadVehicles();
            setShowAddForm(false);
        } catch (err) {
            console.error('Error adding vehicle:', err);
            setError('Failed to add vehicle');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (window.confirm('Are you sure you want to remove this vehicle?')) {
            try {
                setLoading(true);
                await deleteDoc(doc(db, 'vehicles', vehicleId));
                await loadVehicles();
            } catch (err) {
                console.error('Error deleting vehicle:', err);
                setError('Failed to delete vehicle');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-4">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Vehicles</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Add New Vehicle
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    {error}
                </div>
            )}

            {/* Vehicle List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map(vehicle => (
                    <div
                        key={vehicle.id}
                        className="bg-white rounded-lg shadow p-6 border border-gray-200"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                </h3>
                                <p className="text-gray-600">
                                    {vehicle.type} • {vehicle.size}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                Remove
                            </button>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>License Plate: {vehicle.licensePlate}</p>
                            <p>Length: {vehicle.length} ft</p>
                            <p>Weight: {vehicle.weight} lbs</p>
                            {vehicle.hasHazardousMaterials && (
                                <p className="text-yellow-600">⚠️ Contains hazardous materials</p>
                            )}
                            {vehicle.requiresPowerHookup && (
                                <p className="text-blue-600">⚡ Requires power hookup</p>
                            )}
                            {vehicle.notes && (
                                <p className="italic mt-2">{vehicle.notes}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Vehicle Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add New Vehicle</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <VehicleDetailsForm
                            onSubmit={(data) => {
                                handleAddVehicle(data);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleManagement; 