const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Δημιουργία νέου delivery χρήστη
router.post('/delivery', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const newUser = new User({ name, role: 'delivery' });
        await newUser.save();
        res.status(201).json({ message: 'Delivery user created successfully', user: newUser });
    } catch (err) {
        console.error('Error creating delivery user:', err);
        res.status(500).json({ error: 'Failed to create delivery user' });
    }
});

// Λήψη όλων των delivery χρηστών
router.get('/delivery', async (req, res) => {
    try {
        const deliveryUsers = await User.find({ role: 'delivery' });
        res.status(200).json(deliveryUsers);
    } catch (err) {
        console.error('Error fetching delivery users:', err);
        res.status(500).json({ error: 'Failed to fetch delivery users' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Διαγραφή χρήστη από τη βάση δεδομένων
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;