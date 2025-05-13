'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/app/config/firebase';

interface Translation {
  id: string;
  languageCode: string;
  key: string;
  value: string;
}

export default function LanguageManager() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [newTranslation, setNewTranslation] = useState({ key: '', value: '' });

  useEffect(() => {
    fetchTranslations(selectedLanguage);
  }, [selectedLanguage]);

  const fetchTranslations = async (languageCode: string) => {
    try {
      const translationsRef = collection(db, 'translations');
      const snapshot = await getDocs(translationsRef);
      
      const translationsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((translation: any) => translation.languageCode === languageCode) as Translation[];
      
      setTranslations(translationsData);
    } catch (error) {
      console.error('Error fetching translations:', error);
    }
  };

  const handleAddTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'translations'), {
        languageCode: selectedLanguage,
        key: newTranslation.key,
        value: newTranslation.value,
      });

      setNewTranslation({ key: '', value: '' });
      fetchTranslations(selectedLanguage);
    } catch (error) {
      console.error('Error adding translation:', error);
    }
  };

  const handleDeleteTranslation = async (translationId: string) => {
    try {
      await deleteDoc(doc(db, 'translations', translationId));
      fetchTranslations(selectedLanguage);
    } catch (error) {
      console.error('Error deleting translation:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Language</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          {/* Add more languages as needed */}
        </select>
      </div>

      <form onSubmit={handleAddTranslation} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Key</label>
            <input
              type="text"
              value={newTranslation.key}
              onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Value</label>
            <input
              type="text"
              value={newTranslation.value}
              onChange={(e) => setNewTranslation({ ...newTranslation, value: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Translation
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {translations.map((translation) => (
          <div key={translation.id} className="border rounded-lg p-4 shadow-sm">
            <p className="font-semibold">{translation.key}</p>
            <p className="text-gray-600">{translation.value}</p>
            <button
              onClick={() => handleDeleteTranslation(translation.id)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 