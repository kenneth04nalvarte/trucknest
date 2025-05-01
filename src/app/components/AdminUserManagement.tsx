'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  where,
  deleteDoc
} from 'firebase/firestore'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'trucker' | 'property-owner'
  verificationStatus?: 'pending' | 'approved' | 'rejected'
  businessName?: string
  phoneNumber: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export default function AdminUserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'trucker' | 'property-owner'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (user) {
      loadUsers()
    }
  }, [user, roleFilter])

  const loadUsers = async () => {
    try {
      let usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      )

      if (roleFilter !== 'all') {
        usersQuery = query(
          collection(db, 'users'),
          where('role', '==', roleFilter),
          orderBy('createdAt', 'desc')
        )
      }

      const snapshot = await getDocs(usersQuery)
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
      setUsers(usersList)
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'users', userId))
      await loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Failed to delete user')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: Timestamp.now()
      })
      await loadUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      setError('Failed to update user role')
    }
  }

  const filteredUsers = users
    .filter(user => {
      const searchLower = searchTerm.toLowerCase()
      return (
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.businessName?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      }
      if (sortBy === 'email') {
        return sortOrder === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
      }
      if (sortBy === 'role') {
        return sortOrder === 'asc' ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role)
      }
      // date
      return sortOrder === 'asc'
        ? a.createdAt.seconds - b.createdAt.seconds
        : b.createdAt.seconds - a.createdAt.seconds
    })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            placeholder="Search users..."
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            <option value="all">All Users</option>
            <option value="trucker">Truckers</option>
            <option value="property-owner">Property Owners</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  setSortBy('name')
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  setSortBy('email')
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }}
              >
                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  setSortBy('role')
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }}
              >
                Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  setSortBy('date')
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }}
              >
                Created {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  {user.businessName && (
                    <div className="text-sm text-gray-500">{user.businessName}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                  <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value as User['role'])}
                    className="text-sm border border-gray-300 rounded-md shadow-sm py-1 px-2"
                  >
                    <option value="trucker">Trucker</option>
                    <option value="property-owner">Property Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                  {user.role === 'property-owner' && user.verificationStatus && (
                    <div className={`mt-1 text-xs px-2 py-1 rounded-full inline-block
                      ${user.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        user.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 text-red-600 text-sm">{error}</div>
      )}
    </div>
  )
} 