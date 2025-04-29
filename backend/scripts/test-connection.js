require('dotenv').config();
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL : 'Not set');
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME ? process.env.ADMIN_USERNAME : 'Not set');
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'Set (hidden for security)' : 'Not set');

const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('\nTrying to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB!');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Connection error:', error.message);
    }
}

testConnection(); 