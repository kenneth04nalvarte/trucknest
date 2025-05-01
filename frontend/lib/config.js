const config = {
  development: {
    apiUrl: 'http://localhost:3001',
  },
  production: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://trucknest-backend.herokuapp.com',
  },
}

export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return config[env]
} 