'use client'

import { useState, useEffect } from 'react'
import AdminDashboardLayout from '../layout'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users')
        const snapshot = await getDocs(usersRef)
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setUsers(usersList)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">User Management</h1>
        
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="grid gap-6">
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-navy">{user.displayName || user.email}</h2>
                  <p className="text-gray-600">Role: {user.role || 'User'}</p>
                  <div className="mt-4 flex gap-4">
                    <button className="bg-navy text-white px-4 py-2 rounded hover:bg-navy-dark">
                      View Details
                    </button>
                    <button className="bg-orange text-white px-4 py-2 rounded hover:bg-orange-dark">
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  )
} 