import { auth, db } from './firebase.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    doc, 
    updateDoc,
    getDoc
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const parkingListings = document.querySelector('.grid.grid-cols-1.gap-6');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (registerForm) registerForm.addEventListener('submit', handleRegister);

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Logged in:', userCredential.user);
        // Redirect to dashboard or update UI
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const role = e.target.role.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile in Firestore
        await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            email: email,
            role: role,
            createdAt: new Date()
        });
        console.log('Registered:', userCredential.user);
        // Redirect to dashboard based on role
        if (role === 'trucker') {
            window.location.href = 'trucker-dashboard.html';
        } else if (role === 'landowner') {
            window.location.href = 'landowner-dashboard.html';
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
}

// Parking Functions
async function handleSearch(e) {
    e.preventDefault();
    const location = e.target.location.value;
    const date = e.target.date.value;
    const duration = e.target.duration.value;

    try {
        let q = query(collection(db, 'parking'), where('available', '==', true));
        
        if (location) {
            q = query(q, where('location', '>=', location), where('location', '<=', location + '\uf8ff'));
        }
        
        if (duration) {
            q = query(q, where('duration', '==', duration.toLowerCase()));
        }

        const querySnapshot = await getDocs(q);
        const listings = [];
        querySnapshot.forEach((doc) => {
            listings.push({ id: doc.id, ...doc.data() });
        });
        
        displayParkingListings(listings);
    } catch (error) {
        console.error('Error searching parking:', error);
        alert('Error searching for parking spaces. Please try again.');
    }
}

function displayParkingListings(listings) {
    parkingListings.innerHTML = '';
    
    listings.forEach(listing => {
        const listingCard = document.createElement('div');
        listingCard.className = 'bg-white rounded-lg shadow-md overflow-hidden hover-scale';
        listingCard.innerHTML = `
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">${listing.title}</h3>
                <p class="text-gray-600 mb-4">${listing.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-bold text-gray-800">$${listing.price}/${listing.duration}</span>
                    <button class="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600" 
                            onclick="handleBooking('${listing.id}')">
                        Book Now
                    </button>
                </div>
            </div>
        `;
        parkingListings.appendChild(listingCard);
    });
}

async function handleBooking(parkingId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to make a booking');
            return;
        }

        const parkingRef = doc(db, 'parking', parkingId);
        const parkingDoc = await getDoc(parkingRef);
        
        if (!parkingDoc.exists()) {
            throw new Error('Parking space not found');
        }

        // Create booking
        await addDoc(collection(db, 'bookings'), {
            parkingId,
            userId: user.uid,
            status: 'pending',
            createdAt: new Date()
        });

        // Update parking availability
        await updateDoc(parkingRef, {
            available: false
        });

        alert('Booking successful!');
    } catch (error) {
        console.error('Error making booking:', error);
        alert('Error making booking. Please try again.');
    }
}

// List Parking Space
async function handleListParking(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        alert('Please login to list a parking space');
        return;
    }

    const formData = new FormData(e.target);
    // Collect allowedTypes from checkboxes if present
    let allowedTypes = [];
    if (e.target.querySelectorAll) {
        allowedTypes = Array.from(e.target.querySelectorAll('input[name="allowedTypes"]:checked')).map(cb => cb.value);
    }
    try {
        await addDoc(collection(db, 'parking'), {
            title: formData.get('title'),
            description: formData.get('description'),
            location: formData.get('location'),
            price: Number(formData.get('price')),
            duration: formData.get('duration'),
            ownerId: user.uid,
            available: true,
            amenities: formData.get('amenities') ? formData.get('amenities').split(',') : [],
            allowedTypes,
            createdAt: new Date()
        });

        alert('Parking space listed successfully!');
        e.target.reset();
    } catch (error) {
        console.error('Error listing parking:', error);
        alert('Error listing parking space. Please try again.');
    }
}

export { handleListParking }; 