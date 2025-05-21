'use client'

import { useState, useEffect } from 'react'
import AdminDashboardLayout from '../layout'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/config/firebase'

type User = {
  id: string;
  name?: string;
  email?: string;
  displayName?: string;
  role?: string;
  suspended?: boolean;
  // Add other fields as needed
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([])

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
      }
    }

    fetchUsers()
  }, [])

  const suspendUser = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { suspended: true })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, suspended: true } : u))
  }

  const unsuspendUser = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { suspended: false })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, suspended: false } : u))
  }

  return (
    <AdminDashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-navy">User Management</h1>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td>{u.displayName || u.email}</td>
                <td>{u.email}</td>
                <td>{u.role || 'User'}</td>
                <td>{u.suspended === true ? 'Suspended' : 'Active'}</td>
                <td>
                  {u.suspended === true ? (
                    <button className="text-green-600" onClick={() => unsuspendUser(u.id)}>Unsuspend</button>
                  ) : (
                    <button className="text-red-600" onClick={() => suspendUser(u.id)}>Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminDashboardLayout>
  )
} 