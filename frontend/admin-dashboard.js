import { auth, db } from './firebase.js';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    onSnapshot,
    addDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// DOM Elements
const adminEmail = document.getElementById('adminEmail');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

// Charts
let bookingsChart;
let revenueChart;
let userGrowthChart;
let disputeRatioChart;

// Auth Check
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    adminEmail.textContent = user.email;
    initDashboard();
});

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        
        // Update active states
        navLinks.forEach(l => l.classList.remove('active', 'bg-[#FFA500]', 'text-white'));
        sections.forEach(s => s.classList.add('hidden'));
        
        e.target.classList.add('active', 'bg-[#FFA500]', 'text-white');
        document.getElementById(targetId).classList.remove('hidden');

        // Load section data
        switch(targetId) {
            case 'dashboard':
                loadAnalytics();
                break;
            case 'users':
                loadUsers();
                break;
            case 'listings':
                loadListings();
                break;
            case 'bookings':
                loadBookings();
                break;
            case 'disputes':
                loadDisputes();
                break;
        }
    });
});

// Initialize Dashboard
async function initDashboard() {
    await loadAnalytics();
    setupCharts();
    setupListeners();
    setupAlerts();
    startMonitoring();
}

// Enhanced Analytics
async function loadAnalytics() {
    try {
        const stats = await getDetailedStats();
        updateDashboardMetrics(stats);
        updateCharts(stats);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('Error loading analytics', 'error');
    }
}

async function getDetailedStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Parallel queries for better performance
    const [
        usersSnap,
        bookingsSnap,
        listingsSnap,
        disputesSnap
    ] = await Promise.all([
        getDocs(query(collection(db, 'users'))),
        getDocs(query(collection(db, 'bookings'), 
            where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)))),
        getDocs(query(collection(db, 'parking'))),
        getDocs(query(collection(db, 'disputes')))
    ]);

    // Calculate metrics
    const stats = {
        totalUsers: usersSnap.size,
        activeUsers: 0,
        totalBookings: bookingsSnap.size,
        totalRevenue: 0,
        activeListings: 0,
        disputeRatio: 0,
        userTypes: { trucker: 0, landowner: 0 },
        bookingStatus: { pending: 0, approved: 0, completed: 0, cancelled: 0 },
        averageRating: 0
    };

    // Process users
    usersSnap.forEach(doc => {
        const user = doc.data();
        if (user.lastLogin && new Date(user.lastLogin) >= thirtyDaysAgo) {
            stats.activeUsers++;
        }
        if (user.role in stats.userTypes) {
            stats.userTypes[user.role]++;
        }
    });

    // Process bookings
    bookingsSnap.forEach(doc => {
        const booking = doc.data();
        if (booking.status === 'completed' && booking.price) {
            stats.totalRevenue += booking.price;
        }
        if (booking.status in stats.bookingStatus) {
            stats.bookingStatus[booking.status]++;
        }
    });

    // Process listings
    listingsSnap.forEach(doc => {
        const listing = doc.data();
        if (listing.available) {
            stats.activeListings++;
        }
    });

    // Calculate dispute ratio
    stats.disputeRatio = (disputesSnap.size / bookingsSnap.size) || 0;

    return stats;
}

function updateDashboardMetrics(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalBookings').textContent = stats.totalBookings;
    document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;
    document.getElementById('activeListings').textContent = stats.activeListings;
    
    // Update additional metrics
    document.getElementById('activeUsers').textContent = stats.activeUsers;
    document.getElementById('disputeRatio').textContent = `${(stats.disputeRatio * 100).toFixed(1)}%`;
}

// Enhanced Charts Setup
function setupCharts() {
    setupBookingsChart();
    setupRevenueChart();
    setupUserGrowthChart();
    setupDisputeRatioChart();
}

// Real-time Monitoring
function startMonitoring() {
    // Monitor new user registrations
    onSnapshot(query(collection(db, 'users'), 
        where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 300000)))), 
        snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    showNotification('New user registered', 'info');
                }
            });
    });

    // Monitor disputes
    onSnapshot(query(collection(db, 'disputes'), 
        where('status', '==', 'open')), 
        snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    showNotification('New dispute reported', 'warning');
                }
            });
    });

    // Monitor suspicious activities
    onSnapshot(query(collection(db, 'users'), 
        where('loginAttempts.count', '>=', 3)), 
        snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'modified') {
                    showNotification('Suspicious login activity detected', 'error');
                }
            });
    });
}

// Notification System
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.getElementById('notificationArea').appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// User Verification
async function verifyUser(userId, status) {
    try {
        await updateDoc(doc(db, 'users', userId), {
            verificationStatus: status,
            isVerified: status === 'verified'
        });
        showNotification('User verification status updated', 'success');
    } catch (error) {
        console.error('Error updating verification status:', error);
        showNotification('Error updating verification status', 'error');
    }
}

// Dispute Resolution
async function handleDispute(disputeId, resolution) {
    try {
        const disputeRef = doc(db, 'disputes', disputeId);
        await updateDoc(disputeRef, {
            status: 'resolved',
            resolution: resolution,
            resolvedAt: Timestamp.now(),
            resolvedBy: auth.currentUser.uid
        });
        showNotification('Dispute resolved successfully', 'success');
    } catch (error) {
        console.error('Error resolving dispute:', error);
        showNotification('Error resolving dispute', 'error');
    }
}

// Export functions for use in HTML
window.verifyUser = verifyUser;
window.handleDispute = handleDispute;

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (user) {
        initDashboard();
    }
});

// Analytics
async function loadAnalytics() {
    try {
        // Get total users
        const usersQuery = query(collection(db, 'users'));
        const usersSnap = await getDocs(usersQuery);
        document.getElementById('totalUsers').textContent = usersSnap.size;

        // Get total bookings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const bookingsQuery = query(
            collection(db, 'bookings'),
            where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        document.getElementById('totalBookings').textContent = bookingsSnap.size;

        // Calculate total revenue
        let totalRevenue = 0;
        bookingsSnap.forEach(doc => {
            const booking = doc.data();
            if (booking.status === 'completed' && booking.price) {
                totalRevenue += booking.price;
            }
        });
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;

        // Get active listings
        const listingsQuery = query(collection(db, 'parking'), where('available', '==', true));
        const listingsSnap = await getDocs(listingsQuery);
        document.getElementById('activeListings').textContent = listingsSnap.size;

        // Update charts
        updateCharts();
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Charts Setup
function setupCharts() {
    const bookingsCtx = document.getElementById('bookingsChart').getContext('2d');
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');

    bookingsChart = new Chart(bookingsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Bookings',
                data: [],
                borderColor: '#1F3A93',
                tension: 0.1
            }]
        }
    });

    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#FFA500',
                tension: 0.1
            }]
        }
    });
}

async function updateCharts() {
    try {
        // Get last 7 days of data
        const dates = [];
        const bookingCounts = [];
        const revenueCounts = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString());

            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
                where('createdAt', '<=', Timestamp.fromDate(endOfDay))
            );
            const bookingsSnap = await getDocs(bookingsQuery);
            
            let dailyRevenue = 0;
            bookingsSnap.forEach(doc => {
                const booking = doc.data();
                if (booking.status === 'completed' && booking.price) {
                    dailyRevenue += booking.price;
                }
            });

            bookingCounts.push(bookingsSnap.size);
            revenueCounts.push(dailyRevenue);
        }

        // Update charts
        bookingsChart.data.labels = dates;
        bookingsChart.data.datasets[0].data = bookingCounts;
        bookingsChart.update();

        revenueChart.data.labels = dates;
        revenueChart.data.datasets[0].data = revenueCounts;
        revenueChart.update();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Users Management
async function loadUsers() {
    try {
        const usersQuery = query(collection(db, 'users'), limit(20));
        const usersSnap = await getDocs(usersQuery);
        const usersTableBody = document.getElementById('usersTableBody');
        
        usersTableBody.innerHTML = '';
        usersSnap.forEach(doc => {
            const user = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${user.name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${user.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${user.role}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${user.status || 'active'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-[#1F3A93] hover:text-[#FFA500]" onclick="editUser('${doc.id}')">Edit</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Listings Management
async function loadListings() {
    try {
        const listingsQuery = query(collection(db, 'parking'), limit(20));
        const listingsSnap = await getDocs(listingsQuery);
        const listingsTableBody = document.getElementById('listingsTableBody');
        
        listingsTableBody.innerHTML = '';
        listingsSnap.forEach(doc => {
            const listing = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${listing.title}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${listing.ownerEmail || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">$${listing.price}/${listing.duration}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        listing.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${listing.available ? 'Available' : 'Unavailable'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-[#1F3A93] hover:text-[#FFA500] mr-2" onclick="editListing('${doc.id}')">Edit</button>
                    <button class="text-red-600 hover:text-red-900" onclick="deleteListing('${doc.id}')">Delete</button>
                </td>
            `;
            listingsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading listings:', error);
    }
}

// Bookings Management
async function loadBookings() {
    try {
        const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(20));
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookingsTableBody = document.getElementById('bookingsTableBody');
        
        bookingsTableBody.innerHTML = '';
        bookingsSnap.forEach(doc => {
            const booking = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${booking.listingTitle || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${booking.userEmail || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${booking.startDate} - ${booking.endDate}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getStatusColor(booking.status)
                    }">
                        ${booking.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-[#1F3A93] hover:text-[#FFA500]" onclick="viewBooking('${doc.id}')">View</button>
                </td>
            `;
            bookingsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Disputes Management
async function loadDisputes() {
    try {
        const disputesQuery = query(collection(db, 'disputes'), orderBy('createdAt', 'desc'), limit(20));
        const disputesSnap = await getDocs(disputesQuery);
        const disputesTableBody = document.getElementById('disputesTableBody');
        
        disputesTableBody.innerHTML = '';
        disputesSnap.forEach(doc => {
            const dispute = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${dispute.bookingId || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${dispute.reportedByEmail || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${dispute.type}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getDisputeStatusColor(dispute.status)
                    }">
                        ${dispute.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-[#1F3A93] hover:text-[#FFA500]" onclick="handleDispute('${doc.id}')">Handle</button>
                </td>
            `;
            disputesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading disputes:', error);
    }
}

// Helper Functions
function getStatusColor(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'completed':
            return 'bg-blue-100 text-blue-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getDisputeStatusColor(status) {
    switch (status) {
        case 'open':
            return 'bg-red-100 text-red-800';
        case 'in_progress':
            return 'bg-yellow-100 text-yellow-800';
        case 'resolved':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Real-time Listeners
function setupListeners() {
    // Listen for new bookings
    const bookingsQuery = query(collection(db, 'bookings'), where('status', '==', 'pending'));
    onSnapshot(bookingsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // Update UI or show notification
                console.log('New booking:', change.doc.data());
            }
        });
    });

    // Listen for new disputes
    const disputesQuery = query(collection(db, 'disputes'), where('status', '==', 'open'));
    onSnapshot(disputesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // Update UI or show notification
                console.log('New dispute:', change.doc.data());
            }
        });
    });
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already authenticated
    const user = auth.currentUser;
    if (user) {
        initDashboard();
    }
}); 