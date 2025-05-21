# TruckNest Parking App

A Next.js application for managing truck parking spaces and reservations.

## Features

- User authentication and authorization
- Parking space management
- Booking system
- Admin dashboard
- Payment processing
- ID verification
- Promo code management
- Dispute resolution

## Prerequisites

- Node.js 20.x LTS or later
- npm or yarn
- Firebase account
- Stripe account (for payments)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trucknest-parking-app.git
cd trucknest-parking-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

## Deployment

### Deploying to Vercel

1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy the application:
```bash
vercel
```

5. For production deployment:
```bash
vercel --prod
```

### Environment Variables on Vercel

Make sure to add all environment variables from your `.env.local` file to your Vercel project settings:

1. Go to your project on Vercel
2. Navigate to Settings > Environment Variables
3. Add all required environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.