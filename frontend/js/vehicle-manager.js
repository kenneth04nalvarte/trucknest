import { db, auth } from '../firebase.js';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';

class VehicleManager {
    constructor() {
        this.vehicleModal = document.getElementById('vehicleModal');
        this.addVehicleBtn = document.getElementById('addVehicleBtn');
        this.closeVehicleModal = document.getElementById('closeVehicleModal');
        this.vehicleForm = document.getElementById('vehicleForm');
        this.vehiclesList = document.getElementById('vehiclesList');
        
        this.setupEventListeners();
        this.loadVehicles();
    }

    setupEventListeners() {
        this.addVehicleBtn?.addEventListener('click', () => this.openModal());
        this.closeVehicleModal?.addEventListener('click', () => this.closeModal());
        this.vehicleForm?.addEventListener('submit', (e) => this.handleVehicleSubmit(e));

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.vehicleModal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.vehicleModal.classList.remove('hidden');
        this.vehicleForm.reset();
    }

    closeModal() {
        this.vehicleModal.classList.add('hidden');
    }

    async handleVehicleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this.vehicleForm);
            const vehicleData = {
                type: formData.get('type'),
                make: formData.get('make'),
                model: formData.get('model'),
                year: parseInt(formData.get('year')),
                licensePlate: formData.get('licensePlate'),
                length: parseFloat(formData.get('length')),
                weight: parseFloat(formData.get('weight')),
                hazmat: formData.get('hazmat') === 'on',
                powerNeeded: formData.get('powerNeeded') === 'on',
                notes: formData.get('notes'),
                userId: auth.currentUser.uid,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'vehicles'), vehicleData);
            this.closeModal();
            await this.loadVehicles();
            this.showNotification('Vehicle added successfully!', 'success');
        } catch (error) {
            console.error('Error adding vehicle:', error);
            this.showNotification('Failed to add vehicle. Please try again.', 'error');
        }
    }

    async loadVehicles() {
        try {
            const vehiclesQuery = query(
                collection(db, 'vehicles'),
                where('userId', '==', auth.currentUser.uid)
            );
            const snapshot = await getDocs(vehiclesQuery);
            
            this.vehiclesList.innerHTML = '';
            
            if (snapshot.empty) {
                this.vehiclesList.innerHTML = `
                    <div class="col-span-full text-center py-8 text-gray-500">
                        No vehicles added yet. Click "Add Vehicle" to get started.
                    </div>
                `;
                return;
            }

            snapshot.forEach((doc) => {
                const vehicle = doc.data();
                this.vehiclesList.appendChild(this.createVehicleCard(doc.id, vehicle));
            });
        } catch (error) {
            console.error('Error loading vehicles:', error);
            this.showNotification('Failed to load vehicles. Please refresh the page.', 'error');
        }
    }

    createVehicleCard(id, vehicle) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-lg">${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
                <button class="delete-vehicle text-red-500 hover:text-red-700" data-id="${id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div class="text-sm text-gray-600 space-y-1">
                <p><span class="font-medium">Type:</span> ${vehicle.type}</p>
                <p><span class="font-medium">License:</span> ${vehicle.licensePlate}</p>
                <p><span class="font-medium">Length:</span> ${vehicle.length} ft</p>
                <p><span class="font-medium">Weight:</span> ${vehicle.weight.toLocaleString()} lbs</p>
                ${vehicle.hazmat ? '<p class="text-yellow-600">⚠️ Hazardous Materials</p>' : ''}
                ${vehicle.powerNeeded ? '<p class="text-blue-600">⚡ Power Required</p>' : ''}
                ${vehicle.notes ? `<p class="mt-2 text-gray-500"><span class="font-medium">Notes:</span> ${vehicle.notes}</p>` : ''}
            </div>
        `;

        card.querySelector('.delete-vehicle').addEventListener('click', async (e) => {
            if (confirm('Are you sure you want to delete this vehicle?')) {
                try {
                    await deleteDoc(doc(db, 'vehicles', id));
                    await this.loadVehicles();
                    this.showNotification('Vehicle deleted successfully!', 'success');
                } catch (error) {
                    console.error('Error deleting vehicle:', error);
                    this.showNotification('Failed to delete vehicle. Please try again.', 'error');
                }
            }
        });

        return card;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize the vehicle manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VehicleManager();
}); 