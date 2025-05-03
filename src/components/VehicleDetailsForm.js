import React, { useState } from 'react';

const VehicleDetailsForm = ({ onSubmit, initialData = {} }) => {
    const [vehicleDetails, setVehicleDetails] = useState({
        type: initialData.type || '',
        size: initialData.size || '',
        licensePlate: initialData.licensePlate || '',
        make: initialData.make || '',
        model: initialData.model || '',
        year: initialData.year || '',
        length: initialData.length || '',
        weight: initialData.weight || '',
        hasHazardousMaterials: initialData.hasHazardousMaterials || false,
        requiresPowerHookup: initialData.requiresPowerHookup || false,
        notes: initialData.notes || ''
    });

    const [errors, setErrors] = useState({});

    const vehicleTypes = [
        { value: 'semi', label: 'Semi-Truck' },
        { value: 'box_truck', label: 'Box Truck' },
        { value: 'dump_truck', label: 'Dump Truck' },
        { value: 'flatbed', label: 'Flatbed Truck' },
        { value: 'tanker', label: 'Tanker Truck' },
        { value: 'rv', label: 'RV/Motorhome' },
        { value: 'trailer', label: 'Trailer' },
        { value: 'container', label: 'Container' },
        { value: 'other', label: 'Other' }
    ];

    const vehicleSizes = [
        { value: 'small', label: 'Small (Under 20ft)' },
        { value: 'medium', label: 'Medium (20-35ft)' },
        { value: 'large', label: 'Large (35-53ft)' },
        { value: 'oversized', label: 'Oversized (Over 53ft)' }
    ];

    const validateForm = () => {
        const newErrors = {};
        
        if (!vehicleDetails.type) {
            newErrors.type = 'Vehicle type is required';
        }
        if (!vehicleDetails.size) {
            newErrors.size = 'Vehicle size is required';
        }
        if (!vehicleDetails.licensePlate) {
            newErrors.licensePlate = 'License plate is required';
        }
        if (!vehicleDetails.make) {
            newErrors.make = 'Vehicle make is required';
        }
        if (!vehicleDetails.model) {
            newErrors.model = 'Vehicle model is required';
        }
        if (!vehicleDetails.year) {
            newErrors.year = 'Vehicle year is required';
        } else if (isNaN(vehicleDetails.year) || vehicleDetails.year < 1900 || vehicleDetails.year > new Date().getFullYear() + 1) {
            newErrors.year = 'Please enter a valid year';
        }
        if (!vehicleDetails.length) {
            newErrors.length = 'Vehicle length is required';
        }
        if (!vehicleDetails.weight) {
            newErrors.weight = 'Vehicle weight is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(vehicleDetails);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVehicleDetails(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when field is being edited
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Vehicle Type*
                    </label>
                    <select
                        name="type"
                        value={vehicleDetails.type}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.type ? 'border-red-500' : ''}`}
                    >
                        <option value="">Select Type</option>
                        {vehicleTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                </div>

                {/* Vehicle Size */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Vehicle Size*
                    </label>
                    <select
                        name="size"
                        value={vehicleDetails.size}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.size ? 'border-red-500' : ''}`}
                    >
                        <option value="">Select Size</option>
                        {vehicleSizes.map(size => (
                            <option key={size.value} value={size.value}>
                                {size.label}
                            </option>
                        ))}
                    </select>
                    {errors.size && <p className="mt-1 text-sm text-red-500">{errors.size}</p>}
                </div>

                {/* License Plate */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        License Plate*
                    </label>
                    <input
                        type="text"
                        name="licensePlate"
                        value={vehicleDetails.licensePlate}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.licensePlate ? 'border-red-500' : ''}`}
                        placeholder="Enter license plate"
                    />
                    {errors.licensePlate && <p className="mt-1 text-sm text-red-500">{errors.licensePlate}</p>}
                </div>

                {/* Make */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Make*
                    </label>
                    <input
                        type="text"
                        name="make"
                        value={vehicleDetails.make}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.make ? 'border-red-500' : ''}`}
                        placeholder="Enter vehicle make"
                    />
                    {errors.make && <p className="mt-1 text-sm text-red-500">{errors.make}</p>}
                </div>

                {/* Model */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Model*
                    </label>
                    <input
                        type="text"
                        name="model"
                        value={vehicleDetails.model}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.model ? 'border-red-500' : ''}`}
                        placeholder="Enter vehicle model"
                    />
                    {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}
                </div>

                {/* Year */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Year*
                    </label>
                    <input
                        type="number"
                        name="year"
                        value={vehicleDetails.year}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.year ? 'border-red-500' : ''}`}
                        placeholder="Enter vehicle year"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                    />
                    {errors.year && <p className="mt-1 text-sm text-red-500">{errors.year}</p>}
                </div>

                {/* Length */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Length (ft)*
                    </label>
                    <input
                        type="number"
                        name="length"
                        value={vehicleDetails.length}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.length ? 'border-red-500' : ''}`}
                        placeholder="Enter vehicle length"
                        min="1"
                    />
                    {errors.length && <p className="mt-1 text-sm text-red-500">{errors.length}</p>}
                </div>

                {/* Weight */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Weight (lbs)*
                    </label>
                    <input
                        type="number"
                        name="weight"
                        value={vehicleDetails.weight}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.weight ? 'border-red-500' : ''}`}
                        placeholder="Enter vehicle weight"
                        min="1"
                    />
                    {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight}</p>}
                </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="hasHazardousMaterials"
                        checked={vehicleDetails.hasHazardousMaterials}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                        Vehicle contains hazardous materials
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="requiresPowerHookup"
                        checked={vehicleDetails.requiresPowerHookup}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                        Requires power hookup
                    </label>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Additional Notes
                </label>
                <textarea
                    name="notes"
                    value={vehicleDetails.notes}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter any additional details about your vehicle"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Save Vehicle Details
                </button>
            </div>
        </form>
    );
};

export default VehicleDetailsForm; 