import { db } from './lib/firebase'; // or '../lib/firebase' depending on the file location
import { collection, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';


// DOM Elements
let vehiclesList;
let addVehicleForm;
let vehicleTypeSelect;
let defaultVehicleId;

// Initialize the saved vehicles component
export async function initSavedVehicles() {
    vehiclesList = document.getElementById('vehiclesList');
    addVehicleForm = document.getElementById('addVehicleForm');
    vehicleTypeSelect = document.getElementById('vehicleType');

    // Load saved vehicles
    await loadSavedVehicles();

    // Set up event listeners
    addVehicleForm.addEventListener('submit', handleAddVehicle);
    setupVehicleTypeValidation();
}

// Load user's saved vehicles
async function loadSavedVehicles() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const savedVehicles = userDoc.data().savedVehicles || [];
        
        // Clear existing list
        vehiclesList.innerHTML = '';
        
        // Render each vehicle
        savedVehicles.forEach(vehicle => {
            renderVehicleCard(vehicle);
        });

        // Update default vehicle selection
        defaultVehicleId = savedVehicles.find(v => v.isDefault)?.id;
    } catch (error) {
        console.error('Error loading saved vehicles:', error);
        showNotification('Error loading vehicles', 'error');
    }
}

// Render a vehicle card
function renderVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-4 mb-4 hover-scale';
    card.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h3 class="text-lg font-semibold">${vehicle.name}</h3>
                <p class="text-gray-600">${vehicle.type}</p>
                <p class="text-sm text-gray-500">
                    ${vehicle.dimensions.length}L x ${vehicle.dimensions.width}W x ${vehicle.dimensions.height}H
                    ${vehicle.weight ? `| ${vehicle.weight} lbs` : ''}
                </p>
                <p class="text-sm text-gray-500">License: ${vehicle.licensePlate}</p>
            </div>
            <div class="flex flex-col gap-2">
                <button onclick="setDefaultVehicle('${vehicle.id}')" 
                    class="px-3 py-1 rounded ${vehicle.isDefault ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${vehicle.isDefault ? 'Default' : 'Set Default'}
                </button>
                <button onclick="editVehicle('${vehicle.id}')" 
                    class="px-3 py-1 rounded bg-blue-100 text-blue-800">
                    Edit
                </button>
                <button onclick="deleteVehicle('${vehicle.id}')" 
                    class="px-3 py-1 rounded bg-red-100 text-red-800">
                    Delete
                </button>
            </div>
        </div>
    `;
    vehiclesList.appendChild(card);
}

// Handle adding a new vehicle
async function handleAddVehicle(e) {
    e.preventDefault();
    
    try {
        const user = auth.currentUser;
        if (!user) return;

        const formData = new FormData(addVehicleForm);
        const newVehicle = {
            name: formData.get('vehicleName'),
            type: formData.get('vehicleType'),
            dimensions: {
                length: parseFloat(formData.get('length')),
                width: parseFloat(formData.get('width')),
                height: parseFloat(formData.get('height'))
            },
            weight: parseFloat(formData.get('weight')),
            licensePlate: formData.get('licensePlate'),
            registrationNumber: formData.get('registrationNumber'),
            isDefault: !defaultVehicleId // Make default if no default exists
        };

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            savedVehicles: arrayUnion(newVehicle)
        });

        showNotification('Vehicle added successfully', 'success');
        addVehicleForm.reset();
        await loadSavedVehicles();
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showNotification('Error adding vehicle', 'error');
    }
}

// Set a vehicle as default
async function setDefaultVehicle(vehicleId) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const savedVehicles = userDoc.data().savedVehicles;

        // Update default status for all vehicles
        const updatedVehicles = savedVehicles.map(vehicle => ({
            ...vehicle,
            isDefault: vehicle.id === vehicleId
        }));

        await updateDoc(userRef, { savedVehicles: updatedVehicles });
        defaultVehicleId = vehicleId;
        await loadSavedVehicles();
        showNotification('Default vehicle updated', 'success');
    } catch (error) {
        console.error('Error setting default vehicle:', error);
        showNotification('Error updating default vehicle', 'error');
    }
}

// Delete a vehicle
async function deleteVehicle(vehicleId) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const vehicleToDelete = userDoc.data().savedVehicles.find(v => v.id === vehicleId);

        await updateDoc(userRef, {
            savedVehicles: arrayRemove(vehicleToDelete)
        });

        showNotification('Vehicle deleted successfully', 'success');
        await loadSavedVehicles();
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showNotification('Error deleting vehicle', 'error');
    }
}

// Validate vehicle type based on parking space restrictions
function setupVehicleTypeValidation() {
    vehicleTypeSelect.addEventListener('change', async (e) => {
        const selectedType = e.target.value;
        
        try {
            // Check if there are any available parking spaces for this vehicle type
            const parkingQuery = query(
                collection(db, 'parking'),
                where('available', '==', true),
                where('allowedVehicleTypes', 'array-contains', selectedType)
            );
            
            const parkingSnap = await getDocs(parkingQuery);
            
            if (parkingSnap.empty) {
                showNotification(`Warning: No parking spaces currently available for ${selectedType}s`, 'warning');
            }
        } catch (error) {
            console.error('Error checking parking availability:', error);
        }
    });
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.getElementById('notificationArea').appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// Export functions for use in HTML
window.setDefaultVehicle = setDefaultVehicle;
window.deleteVehicle = deleteVehicle;
window.editVehicle = editVehicle; 