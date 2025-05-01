'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/config/firebase'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

interface Language {
  id: string
  code: string
  name: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface Translation {
  id: string
  languageCode: string
  key: string
  value: string
  category: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export default function LanguageManager() {
  const { user } = useAuth()
  const [languages, setLanguages] = useState<Language[]>([])
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [newTranslation, setNewTranslation] = useState({
    key: '',
    value: '',
    category: 'general'
  })
  const [newLanguage, setNewLanguage] = useState({
    code: '',
    name: '',
    isActive: true
  })

  useEffect(() => {
    if (!user) return
    loadLanguages()
  }, [user])

  useEffect(() => {
    if (selectedLanguage) {
      loadTranslations(selectedLanguage)
    }
  }, [selectedLanguage])

  const loadLanguages = async () => {
    try {
      const languagesQuery = query(collection(db, 'languages'))
      const snapshot = await getDocs(languagesQuery)
      const languagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Language[]
      setLanguages(languagesData)
      setLoading(false)
    } catch (err) {
      console.error('Error loading languages:', err)
      setError('Failed to load languages')
      setLoading(false)
    }
  }

  const loadTranslations = async (languageCode: string) => {
    try {
      const translationsQuery = query(
        collection(db, 'translations'),
        where('languageCode', '==', languageCode)
      )
      const snapshot = await getDocs(translationsQuery)
      const translationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Translation[]
      setTranslations(translationsData)
    } catch (err) {
      console.error('Error loading translations:', err)
      setError('Failed to load translations')
    }
  }

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLanguage.code || !newLanguage.name) return

    try {
      await addDoc(collection(db, 'languages'), {
        ...newLanguage,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      setNewLanguage({
        code: '',
        name: '',
        isActive: true
      })

      loadLanguages()
    } catch (err) {
      console.error('Error adding language:', err)
      setError('Failed to add language')
    }
  }

  const handleToggleLanguage = async (languageId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'languages', languageId), {
        isActive,
        updatedAt: Timestamp.now()
      })

      loadLanguages()
    } catch (err) {
      console.error('Error updating language:', err)
      setError('Failed to update language')
    }
  }

  const handleAddTranslation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLanguage || !newTranslation.key || !newTranslation.value) return

    try {
      await addDoc(collection(db, 'translations'), {
        languageCode: selectedLanguage,
        ...newTranslation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      setNewTranslation({
        key: '',
        value: '',
        category: 'general'
      })

      loadTranslations(selectedLanguage)
    } catch (err) {
      console.error('Error adding translation:', err)
      setError('Failed to add translation')
    }
  }

  const handleUpdateTranslation = async (translationId: string, value: string) => {
    try {
      await updateDoc(doc(db, 'translations', translationId), {
        value,
        updatedAt: Timestamp.now()
      })

      loadTranslations(selectedLanguage)
    } catch (err) {
      console.error('Error updating translation:', err)
      setError('Failed to update translation')
    }
  }

  const handleDeleteTranslation = async (translationId: string) => {
    try {
      await deleteDoc(doc(db, 'translations', translationId))
      loadTranslations(selectedLanguage)
    } catch (err) {
      console.error('Error deleting translation:', err)
      setError('Failed to delete translation')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
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
                value={newLanguage.code}
                onChange={(e) => setNewLanguage({ ...newLanguage, code: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="e.g., en, es, fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Language Name</label>
              <input
                type="text"
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                placeholder="e.g., English, Spanish, French"
              />
            </div>

            <button
              type="submit"
              disabled={!newLanguage.code || !newLanguage.name}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Add Language
            </button>
          </form>
        </div>

        {/* Languages List */}
        <div className="divide-y divide-gray-200">
          {languages.map(language => (
            <div key={language.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{language.name}</h3>
                  <p className="text-sm text-gray-500">{language.code}</p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => setSelectedLanguage(language.code)}
                    className="text-blue-600 hover:text-blue-800 text-sm mr-4"
                  >
                    Edit Translations
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={language.isActive}
                      onChange={(e) => handleToggleLanguage(language.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Translations Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Translations</h2>
          
          {selectedLanguage ? (
            <>
              {/* Add Translation Form */}
              <form onSubmit={handleAddTranslation} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Translation Key</label>
                  <input
                    type="text"
                    value={newTranslation.key}
                    onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    placeholder="e.g., common.welcome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Translation Value</label>
                  <input
                    type="text"
                    value={newTranslation.value}
                    onChange={(e) => setNewTranslation({ ...newTranslation, value: e.target.value })}
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    placeholder="Enter translation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newTranslation.category}
                    onChange={(e) => setNewTranslation({ ...newTranslation, category: e.target.value })}
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                  >
                    <option value="general">General</option>
                    <option value="auth">Authentication</option>
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="profile">Profile</option>
                    <option value="notifications">Notifications</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!newTranslation.key || !newTranslation.value}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Add Translation
                </button>
              </form>

              {/* Translations List */}
              <div className="mt-6 space-y-4">
                {translations.map(translation => (
                  <div key={translation.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{translation.key}</h3>
                        <p className="text-xs text-gray-500">{translation.category}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTranslation(translation.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <input
                      type="text"
                      value={translation.value}
                      onChange={(e) => handleUpdateTranslation(translation.id, e.target.value)}
                      className="mt-2 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center mt-4">Select a language to manage translations</p>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 