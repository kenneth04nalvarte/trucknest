import { auth, db } from './firebase.js';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch
} from 'firebase/firestore';

// Bulk listing management functionality
export async function initBulkListingManagement() {
    const bulkActionsForm = document.getElementById('bulkActionsForm');
    const selectAllCheckbox = document.getElementById('selectAllListings');
    const bulkActionSelect = document.getElementById('bulkAction');
    const listingsContainer = document.getElementById('listingsContainer');
    const bulkEditModal = document.getElementById('bulkEditModal');
    
    // Load all listings for the landowner
    await loadLandownerListings();

    // Event listeners
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }

    if (bulkActionsForm) {
        bulkActionsForm.addEventListener('submit', handleBulkAction);
    }
}

// Load all listings for the current landowner
async function loadLandownerListings() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const listingsContainer = document.getElementById('listingsContainer');
        if (!listingsContainer) return;

        const listingsQuery = query(
            collection(db, 'parking'),
            where('ownerId', '==', user.uid)
        );

        const listingsSnapshot = await getDocs(listingsQuery);
        const listings = [];
        
        listingsSnapshot.forEach(doc => {
            listings.push({ id: doc.id, ...doc.data() });
        });

        renderListings(listings);
    } catch (error) {
        console.error('Error loading listings:', error);
        showNotification('Error loading listings', 'error');
    }
}

// Render listings with checkboxes
function renderListings(listings) {
    const listingsContainer = document.getElementById('listingsContainer');
    if (!listingsContainer) return;

    listingsContainer.innerHTML = listings.map(listing => `
        <div class="listing-card bg-white rounded-lg shadow p-4 mb-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <input type="checkbox" 
                           name="selectedListings" 
                           value="${listing.id}" 
                           class="listing-checkbox mr-4">
                    <div>
                        <h3 class="text-lg font-semibold">${listing.title}</h3>
                        <p class="text-gray-600">${listing.location}</p>
                        <p class="text-sm text-gray-500">$${listing.price}/${listing.duration}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 rounded ${listing.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${listing.available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>
            <div class="mt-2">
                <p class="text-sm text-gray-600">
                    Allowed Types: ${listing.allowedTypes?.join(', ') || 'All Types'}
                </p>
            </div>
        </div>
    `).join('');
}

// Handle select all checkbox
function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.listing-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
}

// Handle bulk actions
async function handleBulkAction(e) {
    e.preventDefault();
    const selectedListings = Array.from(document.querySelectorAll('.listing-checkbox:checked')).map(cb => cb.value);
    const action = document.getElementById('bulkAction').value;

    if (selectedListings.length === 0) {
        showNotification('Please select at least one listing', 'error');
        return;
    }

    try {
        const batch = writeBatch(db);

        switch (action) {
            case 'availability':
                await handleBulkAvailability(selectedListings);
                break;
            case 'price':
                await handleBulkPriceUpdate(selectedListings);
                break;
            case 'delete':
                await handleBulkDelete(selectedListings);
                break;
            case 'allowedTypes':
                await handleBulkAllowedTypes(selectedListings);
                break;
        }

        await batch.commit();
        showNotification('Bulk action completed successfully', 'success');
        await loadLandownerListings(); // Refresh the listings
    } catch (error) {
        console.error('Error performing bulk action:', error);
        showNotification('Error performing bulk action', 'error');
    }
}

// Handle bulk availability update
async function handleBulkAvailability(listingIds) {
    const newAvailability = confirm('Set selected listings as available?');
    const batch = writeBatch(db);

    listingIds.forEach(id => {
        const listingRef = doc(db, 'parking', id);
        batch.update(listingRef, { available: newAvailability });
    });

    await batch.commit();
}

// Handle bulk price update
async function handleBulkPriceUpdate(listingIds) {
    const newPrice = prompt('Enter new price for selected listings:');
    if (!newPrice || isNaN(newPrice)) return;

    const batch = writeBatch(db);
    listingIds.forEach(id => {
        const listingRef = doc(db, 'parking', id);
        batch.update(listingRef, { price: Number(newPrice) });
    });

    await batch.commit();
}

// Handle bulk delete
async function handleBulkDelete(listingIds) {
    if (!confirm('Are you sure you want to delete the selected listings? This action cannot be undone.')) return;

    const batch = writeBatch(db);
    listingIds.forEach(id => {
        const listingRef = doc(db, 'parking', id);
        batch.delete(listingRef);
    });

    await batch.commit();
}

// Handle bulk allowed types update
async function handleBulkAllowedTypes(listingIds) {
    const bulkEditModal = document.getElementById('bulkEditModal');
    if (!bulkEditModal) return;

    // Show modal and wait for form submission
    bulkEditModal.classList.remove('hidden');
    
    const form = bulkEditModal.querySelector('form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const selectedTypes = Array.from(form.querySelectorAll('input[name="allowedTypes"]:checked'))
            .map(cb => cb.value);

        const batch = writeBatch(db);
        listingIds.forEach(id => {
            const listingRef = doc(db, 'parking', id);
            batch.update(listingRef, { allowedTypes: selectedTypes });
        });

        await batch.commit();
        bulkEditModal.classList.add('hidden');
        await loadLandownerListings();
    };
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const notificationArea = document.getElementById('notificationArea');
    if (notificationArea) {
        notificationArea.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
} 