# TruckNest - Truck Parking Marketplace

TruckNest is an Airbnb-like platform that connects truckers with available parking spaces. Landowners can list their parking lots, and truckers can book spaces for daily, weekly, or monthly periods.

## Features

- User authentication for both truckers and landowners
- Parking space listings with photos, amenities, and pricing
- Booking system with flexible duration options
- Real-time availability calendar
- Secure payment processing
- Rating and review system
- Messaging system between users

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- Payment Processing: Stripe
- Maps Integration: Google Maps API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Create a `.env` file in both frontend and backend directories with necessary environment variables

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## Project Structure

```
trucknest/
├── frontend/           # React frontend application
├── backend/            # Node.js/Express backend
└── README.md
```

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details 