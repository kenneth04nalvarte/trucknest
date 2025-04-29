const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vehicleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Truck', 'Heavy Equipment', 'Boat', 'RV', 'Container'],
        required: true
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    weight: Number,
    licensePlate: String,
    registrationNumber: String,
    isDefault: {
        type: Boolean,
        default: false
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['trucker', 'landowner', 'admin'],
        required: true
    },
    phone: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    businessCredentials: {
        companyName: String,
        registrationNumber: String,
        businessAddress: String,
        documentsUrl: [String]
    },
    savedVehicles: [vehicleSchema],
    ratings: [{
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    lastLogin: Date,
    loginAttempts: {
        count: { type: Number, default: 0 },
        lastAttempt: Date
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 