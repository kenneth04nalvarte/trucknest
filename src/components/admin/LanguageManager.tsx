import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const LanguageManager: React.FC = () => {
  const { user } = useAuth();
  const [languages, setLanguages] = useState<string[]>(['en', 'es', 'fr']);

  if (!user) {
    return <div>Please sign in to access this feature.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Language Management</h2>
      <div className="space-y-4">
        {languages.map((lang) => (
          <div key={lang} className="flex items-center justify-between p-4 border rounded">
            <span className="font-medium">{lang.toUpperCase()}</span>
            <div className="space-x-2">
              <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Edit
              </button>
              <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Add New Language
        </button>
      </div>
    </div>
  );
};

export default LanguageManager; 