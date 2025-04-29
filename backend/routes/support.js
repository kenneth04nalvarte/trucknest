const express = require('express');
const router = express.Router();
const { db } = require('../firebase-admin');

// Get all tickets for a user
router.get('/tickets/:userId', async (req, res) => {
    try {
        const ticketsRef = db.collection('supportTickets');
        const snapshot = await ticketsRef
            .where('userId', '==', req.params.userId)
            .orderBy('createdAt', 'desc')
            .get();

        const tickets = [];
        snapshot.forEach(doc => {
            tickets.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Error fetching support tickets' });
    }
});

// Create a new ticket
router.post('/tickets', async (req, res) => {
    try {
        const {
            userId,
            userEmail,
            type,
            subject,
            description,
            priority,
            bookingId
        } = req.body;

        const ticketData = {
            userId,
            userEmail,
            type,
            subject,
            description,
            priority,
            bookingId,
            status: 'open',
            createdAt: new Date().toISOString(),
            updates: [],
            escalated: false
        };

        const docRef = await db.collection('supportTickets').add(ticketData);
        
        // If it's a payment dispute, create a case in the disputes collection
        if (type === 'payment') {
            await db.collection('disputes').add({
                ticketId: docRef.id,
                userId,
                bookingId,
                status: 'under_review',
                createdAt: new Date().toISOString(),
                resolution: null
            });
        }

        res.status(201).json({
            id: docRef.id,
            ...ticketData
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Error creating support ticket' });
    }
});

// Update a ticket
router.put('/tickets/:ticketId', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const updateData = req.body;

        await db.collection('supportTickets').doc(ticketId).update({
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        // If escalating, notify admin
        if (updateData.escalated) {
            await db.collection('adminNotifications').add({
                type: 'ticket_escalation',
                ticketId,
                userId: updateData.userId,
                createdAt: new Date().toISOString(),
                status: 'unread'
            });
        }

        res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Error updating support ticket' });
    }
});

// Add an update to a ticket
router.post('/tickets/:ticketId/updates', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, userId, userType } = req.body;

        const ticketRef = db.collection('supportTickets').doc(ticketId);
        const ticket = await ticketRef.get();

        if (!ticket.exists) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const update = {
            message,
            userId,
            userType,
            timestamp: new Date().toISOString()
        };

        await ticketRef.update({
            updates: [...ticket.data().updates, update],
            updatedAt: new Date().toISOString()
        });

        res.json({ message: 'Update added successfully' });
    } catch (error) {
        console.error('Error adding update:', error);
        res.status(500).json({ message: 'Error adding update to ticket' });
    }
});

// Close a ticket
router.post('/tickets/:ticketId/close', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { resolution } = req.body;

        await db.collection('supportTickets').doc(ticketId).update({
            status: 'closed',
            resolution,
            closedAt: new Date().toISOString()
        });

        res.json({ message: 'Ticket closed successfully' });
    } catch (error) {
        console.error('Error closing ticket:', error);
        res.status(500).json({ message: 'Error closing ticket' });
    }
});

// Get dispute details
router.get('/disputes/:disputeId', async (req, res) => {
    try {
        const { disputeId } = req.params;
        const dispute = await db.collection('disputes').doc(disputeId).get();

        if (!dispute.exists) {
            return res.status(404).json({ message: 'Dispute not found' });
        }

        res.json({
            id: dispute.id,
            ...dispute.data()
        });
    } catch (error) {
        console.error('Error fetching dispute:', error);
        res.status(500).json({ message: 'Error fetching dispute details' });
    }
});

module.exports = router; 