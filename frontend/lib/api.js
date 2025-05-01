import { getConfig } from './config'

export const api = {
  async get(endpoint) {
    const { apiUrl } = getConfig()
    const response = await fetch(`${apiUrl}${endpoint}`)
    return response.json()
  },

  async post(endpoint, data) {
    const { apiUrl } = getConfig()
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async put(endpoint, data) {
    const { apiUrl } = getConfig()
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async delete(endpoint) {
    const { apiUrl } = getConfig()
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'DELETE',
    })
    return response.json()
  },
} 