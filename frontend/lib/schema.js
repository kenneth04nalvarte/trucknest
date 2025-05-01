import { db } from './firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROPERTY_OWNERS: 'property_owners',
  TRUCKERS: 'truckers',
  PROPERTIES: 'properties',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  TRANSACTIONS: 'transactions'
};

// Create a new user profile
export async function createUserProfile(userId, userData, role) {
  try {
    // Create base user document
    await setDoc(doc(db, COLLECTIONS.USERS, userId), {
      email: userData.email,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create role-specific profile
    if (role === 'property-owner') {
      await setDoc(doc(db, COLLECTIONS.PROPERTY_OWNERS, userId), {
        businessName: userData.businessName,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zipCode: userData.zipCode,
        taxId: userData.taxId,
        bankingInfo: {
          accountHolder: userData.accountHolder,
          accountNumber: userData.accountNumber,
          routingNumber: userData.routingNumber,
          bankName: userData.bankName
        },
        verificationStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (role === 'trucker') {
      await setDoc(doc(db, COLLECTIONS.TRUCKERS, userId), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zipCode: userData.zipCode,
        companyName: userData.companyName,
        vehicle: {
          type: userData.vehicleType,
          dimensions: {
            length: userData.vehicleLength,
            width: userData.vehicleWidth,
            height: userData.vehicleHeight
          },
          licensePlate: userData.licensePlate,
          registrationNumber: userData.registrationNumber
        },
        documents: {
          driversLicense: userData.driversLicense,
          commercialLicense: userData.commercialLicense,
          insurance: {
            provider: userData.insuranceProvider,
            policyNumber: userData.insurancePolicy
          }
        },
        verificationStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    // Get base user document
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    let profileData = {};

    // Get role-specific profile
    if (userData.role === 'property-owner') {
      const ownerDoc = await getDoc(doc(db, COLLECTIONS.PROPERTY_OWNERS, userId));
      if (ownerDoc.exists()) {
        profileData = ownerDoc.data();
      }
    } else if (userData.role === 'trucker') {
      const truckerDoc = await getDoc(doc(db, COLLECTIONS.TRUCKERS, userId));
      if (truckerDoc.exists()) {
        profileData = truckerDoc.data();
      }
    }

    return {
      ...userData,
      profile: profileData
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// Property schema example
export const propertySchema = {
  ownerId: 'string', // Reference to property_owners collection
  address: 'string',
  city: 'string',
  state: 'string',
  zipCode: 'string',
  location: {
    latitude: 'number',
    longitude: 'number'
  },
  spaceAvailable: 'number', // in square feet
  surfaceType: 'string', // concrete, asphalt, gravel, dirt
  amenities: {
    lighting: 'boolean',
    security: 'boolean',
    cameras: 'boolean',
    fencing: 'boolean',
    restrooms: 'boolean',
    waterSupply: 'boolean'
  },
  pricing: {
    hourly: 'number',
    daily: 'number',
    weekly: 'number',
    monthly: 'number'
  },
  status: 'string', // active, inactive, pending
  photos: ['string'], // Array of photo URLs
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Booking schema example
export const bookingSchema = {
  propertyId: 'string', // Reference to properties collection
  truckerId: 'string', // Reference to truckers collection
  ownerId: 'string', // Reference to property_owners collection
  startDate: 'timestamp',
  endDate: 'timestamp',
  vehicleType: 'string',
  vehicleDimensions: {
    length: 'number',
    width: 'number',
    height: 'number'
  },
  status: 'string', // pending, confirmed, cancelled, completed
  totalAmount: 'number',
  paymentStatus: 'string', // pending, paid, refunded
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Review schema example
export const reviewSchema = {
  bookingId: 'string', // Reference to bookings collection
  reviewerId: 'string', // User ID of the reviewer
  revieweeId: 'string', // User ID of the person being reviewed
  rating: 'number', // 1-5
  comment: 'string',
  createdAt: 'timestamp'
};

// Transaction schema example
export const transactionSchema = {
  bookingId: 'string', // Reference to bookings collection
  amount: 'number',
  currency: 'string',
  status: 'string', // pending, completed, failed, refunded
  paymentMethod: 'string',
  paymentId: 'string', // Payment processor's transaction ID
  createdAt: 'timestamp'
}; 