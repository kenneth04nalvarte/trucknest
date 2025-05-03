'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc, addDoc, FirestoreError } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { Property as PropertyType } from '@/types/property';

interface BaseLandowner {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  createdAt: string;
  updatedAt: string;
  rating: number;
  totalReviews: number;
}

interface Landowner extends BaseLandowner {
  properties: PropertyType[];
}

interface Property {
  id: string;
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  priceRules: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  images: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Favorite {
  id: string;
  userId: string;
  landownerId: string;
  createdAt: string;
}

export default function FavoriteLandowners() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [landowners, setLandowners] = useState<Landowner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Landowner[]>([]);

  useEffect(() => {
    if (user?.uid) {
      loadFavorites();
    }
  }, [user?.uid]);

  const loadFavorites = async () => {
    try {
      if (!user?.uid) return;

      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoritesList = favoritesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Favorite[];

      setFavorites(favoritesList);
      await loadLandowners(favoritesList);
      setLoading(false);
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error loading favorites:', error);
      setError(`Failed to load favorites: ${error.message}`);
      setLoading(false);
    }
  };

  const loadLandowners = async (favoritesList: Favorite[]) => {
    try {
      const landownersList: Landowner[] = [];
      
      for (const favorite of favoritesList) {
        const landownerDoc = await getDoc(doc(db, 'landowners', favorite.landownerId));
        if (!landownerDoc.exists()) continue;

        const landownerData = landownerDoc.data();
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('ownerId', '==', favorite.landownerId)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const propertiesList = propertiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PropertyType[];

        landownersList.push({
          id: landownerDoc.id,
          name: landownerData.name,
          email: landownerData.email,
          phone: landownerData.phone,
          address: landownerData.address,
          verificationStatus: landownerData.verificationStatus,
          createdAt: landownerData.createdAt,
          updatedAt: landownerData.updatedAt,
          rating: typeof landownerData.rating === 'number' ? landownerData.rating : 0,
          totalReviews: typeof landownerData.totalReviews === 'number' ? landownerData.totalReviews : 0,
          properties: propertiesList
        });
      }

      setLandowners(landownersList);
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error loading landowners:', error);
      setError(`Failed to load landowners: ${error.message}`);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setSearchResults([]);
      return;
    }

    const results = landowners.filter(landowner =>
      landowner.name.toLowerCase().includes(term.toLowerCase()) ||
      landowner.address.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleAddFavorite = async (landownerId: string) => {
    try {
      if (!user?.uid) {
        setError('You must be logged in to add favorites');
        return;
      }

      const favoriteData = {
        userId: user.uid,
        landownerId,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'favorites'), favoriteData);
      loadFavorites();
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error adding favorite:', error);
      setError(`Failed to add favorite: ${error.message}`);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      if (!user?.uid) {
        setError('You must be logged in to remove favorites');
        return;
      }

      await deleteDoc(doc(db, 'favorites', favoriteId));
      loadFavorites();
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error removing favorite:', error);
      setError(`Failed to remove favorite: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Favorite Landowners</h1>

      {landowners.length === 0 ? (
        <div className="text-center text-gray-500">
          No favorite landowners yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landowners.map((landowner) => (
            <div
              key={landowner.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{landowner.name}</h2>
                    <p className="text-gray-600">{landowner.email}</p>
                    <p className="text-gray-600">{landowner.phone}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(landowner.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium text-gray-700">Properties</h3>
                  <ul className="mt-2 space-y-2">
                    {landowner.properties.map((property) => (
                      <li
                        key={property.id}
                        className="text-sm text-gray-600"
                      >
                        {property.name} - {property.location.address}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-gray-600">
                      {landowner.rating} ({landowner.totalReviews} reviews)
                    </span>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      landowner.verificationStatus === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : landowner.verificationStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {landowner.verificationStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 