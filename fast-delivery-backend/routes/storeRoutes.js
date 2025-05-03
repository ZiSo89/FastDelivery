const express = require('express');
const router = express.Router();
const Store = require('../models/Store');

// Δημιουργία νέου καταστήματος
router.post('/', async (req, res) => {
    try {
        const { name, address, workingHours } = req.body;
        const store = new Store({ name, address, workingHours });
        await store.save();
        res.status(201).json(store);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Λήψη όλων των καταστημάτων
router.get('/', async (req, res) => {
    try {
        const stores = await Store.find();
        res.status(200).json(stores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Διαγραφή καταστήματος
router.delete('/:id', async (req, res) => {
    try {
        const storeId = req.params.id;
        const deletedStore = await Store.findByIdAndDelete(storeId);
        if (!deletedStore) {
            return res.status(404).json({ error: 'Store not found' });
        }
        res.status(200).json({ message: 'Store deleted successfully', store: deletedStore });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;