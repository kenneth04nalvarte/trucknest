const express = require('express');
const router = express.Router();
const Parking = require('../models/Parking');
const LandVerification = require('../utils/LandVerification');
const adminRoutes = require('./routes/admin');

// Search parking spaces
router.post('/search', async (req, res) => {
    try {
        const { location, date, duration } = req.body;
        
        const query = {
            available: true,
            location: { $regex: location, $options: 'i' }
        };

        if (duration) {
            query.duration = duration;
        }

        const parkingSpaces = await Parking.find(query);
        res.json(parkingSpaces);
    } catch (error) {
        console.error('Error searching parking:', error);
        res.status(500).json({ message: 'Error searching parking spaces' });
    }
});

// Create new parking space
router.post('/', async (req, res) => {
    try {
        const parking = new Parking(req.body);
        const verificationResult = await landVerification.submitVerification();
        if (!verificationResult) {
            return res.status(400).json({ message: 'Verification failed' });
        }
        await parking.save();
        res.status(201).json(parking);
    } catch (error) {
        console.error('Error creating parking:', error);
        res.status(400).json({ message: 'Error creating parking space' });
    }
});

// Get parking space by ID
router.get('/:id', async (req, res) => {
    try {
        const parking = await Parking.findById(req.params.id);
        if (!parking) {
            return res.status(404).json({ message: 'Parking space not found' });
        }
        res.json(parking);
    } catch (error) {
        console.error('Error getting parking:', error);
        res.status(500).json({ message: 'Error getting parking space' });
    }
});

// Update parking space
router.put('/:id', async (req, res) => {
    try {
        const parking = await Parking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!parking) {
            return res.status(404).json({ message: 'Parking space not found' });
        }
        res.json(parking);
    } catch (error) {
        console.error('Error updating parking:', error);
        res.status(400).json({ message: 'Error updating parking space' });
    }
});

const landVerification = new LandVerification('verificationContainer', userId, isBusinessAccount);

router.use('/admin', adminRoutes);

module.exports = router; 