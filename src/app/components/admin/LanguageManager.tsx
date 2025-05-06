'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/app/config/firebase'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  FirestoreError,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore'

export type LanguageCode = string;
export type TranslationCategory = 'general' | 'auth' | 'booking' | 'payment' | 'profile' | 'settings';

export interface Language {
  id: string;
  code: LanguageCode;
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Translation {
  id: string;
  languageCode: LanguageCode;
  key: string;
  value: string;
  category: TranslationCategory;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface NewLanguage {
  code: LanguageCode;
  name: string;
  isActive: boolean;
}

interface NewTranslation {
  key: string;
  value: string;
  category: TranslationCategory;
}

interface LanguageManagerState {
  languages: Language[];
  translations: Translation[];
  loading: boolean;
  error: string;
  selectedLanguage: LanguageCode;
  newTranslation: NewTranslation;
  newLanguage: NewLanguage;
}

const initialState: LanguageManagerState = {
  languages: [],
  translations: [],
  loading: true,
  error: '',
  selectedLanguage: '',
  newTranslation: {
    key: '',
    value: '',
    category: 'general'
  },
  newLanguage: {
    code: '',
    name: '',
    isActive: true
  }
};

export default function LanguageManager() {
  const { user } = useAuth();
  const [state, setState] = useState<LanguageManagerState>(initialState);

  const updateState = useCallback((updates: Partial<LanguageManagerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadLanguages();
  }, [user]);

  useEffect(() => {
    if (state.selectedLanguage) {
      fetchTranslations(state.selectedLanguage);
    }
  }, [state.selectedLanguage]);

  const loadLanguages = useCallback(async () => {
    try {
      const languagesQuery = query(collection(db, 'languages'));
      const snapshot = await getDocs(languagesQuery);
      const languagesData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
      })) as Language[];
      updateState({ languages: languagesData, loading: false });
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error loading languages:', error);
      updateState({ error: 'Failed to load languages', loading: false });
    }
  }, [updateState]);

  const fetchTranslations = useCallback(async (languageCode: LanguageCode) => {
    try {
      const translationsRef = collection(db, 'translations');
      const snapshot = await getDocs(translationsRef);
      
      const translationsData = snapshot.docs
        .map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            id: doc.id,
            languageCode: data.languageCode,
            key: data.key,
            value: data.value,
            category: data.category,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          } as Translation;
        })
        .filter((translation: Translation) => translation.languageCode === languageCode);
      
      updateState({ translations: translationsData });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Error fetching translations:', firestoreError);
      updateState({ error: 'Failed to fetch translations' });
    }
  }, [updateState]);

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.newLanguage.code || !state.newLanguage.name) return;

    try {
      await addDoc(collection(db, 'languages'), {
        ...state.newLanguage,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      updateState({
        newLanguage: initialState.newLanguage
      });

      loadLanguages();
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error adding language:', error);
      updateState({ error: 'Failed to add language' });
    }
  };

  const handleToggleLanguage = async (languageId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'languages', languageId), {
        isActive,
        updatedAt: Timestamp.now()
      });

      loadLanguages();
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error updating language:', error);
      updateState({ error: 'Failed to update language' });
    }
  };

  const handleAddTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedLanguage || !state.newTranslation.key || !state.newTranslation.value) return;

    try {
      await addDoc(collection(db, 'translations'), {
        languageCode: state.selectedLanguage,
        ...state.newTranslation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      updateState({
        newTranslation: initialState.newTranslation
      });

      fetchTranslations(state.selectedLanguage);
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error adding translation:', error);
      updateState({ error: 'Failed to add translation' });
    }
  };

  const handleUpdateTranslation = async (translationId: string, value: string) => {
    try {
      await updateDoc(doc(db, 'translations', translationId), {
        value,
        updatedAt: Timestamp.now()
      });

      fetchTranslations(state.selectedLanguage);
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error updating translation:', error);
      updateState({ error: 'Failed to update translation' });
    }
  };

  const handleDeleteTranslation = async (translationId: string) => {
    try {
      await deleteDoc(doc(db, 'translations', translationId));
      fetchTranslations(state.selectedLanguage);
    } catch (err) {
      const error = err as FirestoreError;
      console.error('Error deleting translation:', error);
      updateState({ error: 'Failed to delete translation' });
    }
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Languages Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Languages</h2>
          
          {/* Add Language Form */}
          <form onSubmit={handleAddLanguage} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Language Code</label>
              <input
                type="text"
                value={state.newLanguage.code}
                onChange={(e) => updateState({ newLanguage: { ...state.newLanguage, code: e.target.value } })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="e.g., en, es, fr"
                maxLength={5}
                pattern="[a-z]{2}(-[A-Z]{2})?"
                title="Use ISO 639-1 language code (e.g., en, es, fr) or with region (e.g., en-US, es-ES)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Language Name</label>
              <input
                type="text"
                value={state.newLanguage.name}
                onChange={(e) => updateState({ newLanguage: { ...state.newLanguage, name: e.target.value } })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="e.g., English, Spanish, French"
                maxLength={50}
              />
            </div>

            <button
              type="submit"
              disabled={!state.newLanguage.code || !state.newLanguage.name}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Add Language
            </button>
          </form>
        </div>

        {/* Languages List */}
        <div className="divide-y divide-gray-200">
          {state.languages.map(language => (
            <div key={language.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{language.name}</h3>
                  <p className="text-sm text-gray-500">{language.code}</p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => updateState({ selectedLanguage: language.code })}
                    className="text-blue-600 hover:text-blue-800 text-sm mr-4"
                  >
                    Edit Translations
                  </button>
                  <button
                    onClick={() => handleToggleLanguage(language.id, !language.isActive)}
                    className={`text-sm px-3 py-1 rounded ${
                      language.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {language.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Translations Section */}
      {state.selectedLanguage && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Translations</h2>
            
            {/* Add Translation Form */}
            <form onSubmit={handleAddTranslation} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Translation Key</label>
                <input
                  type="text"
                  value={state.newTranslation.key}
                  onChange={(e) => updateState({ newTranslation: { ...state.newTranslation, key: e.target.value } })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  placeholder="e.g., welcome_message"
                  maxLength={100}
                  pattern="[a-z_]+"
                  title="Use lowercase letters and underscores only"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Translation Value</label>
                <input
                  type="text"
                  value={state.newTranslation.value}
                  onChange={(e) => updateState({ newTranslation: { ...state.newTranslation, value: e.target.value } })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  placeholder="e.g., Welcome to our app!"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={state.newTranslation.category}
                  onChange={(e) => updateState({ newTranslation: { ...state.newTranslation, category: e.target.value as TranslationCategory } })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                >
                  <option value="general">General</option>
                  <option value="auth">Authentication</option>
                  <option value="booking">Booking</option>
                  <option value="payment">Payment</option>
                  <option value="profile">Profile</option>
                  <option value="settings">Settings</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!state.newTranslation.key || !state.newTranslation.value}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Add Translation
              </button>
            </form>
          </div>

          {/* Translations List */}
          <div className="divide-y divide-gray-200">
            {state.translations.map(translation => (
              <div key={translation.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{translation.key}</h3>
                    <p className="text-sm text-gray-500">{translation.category}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={translation.value}
                      onChange={(e) => handleUpdateTranslation(translation.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                      maxLength={500}
                    />
                    <button
                      onClick={() => handleDeleteTranslation(translation.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="col-span-full">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {state.error}
          </div>
        </div>
      )}
    </div>
  );
} 