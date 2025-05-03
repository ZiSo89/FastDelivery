const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Δημιουργία νέας παραγγελίας
router.post('/', async (req, res) => {
    try {
        const { address, items, storeId, status } = req.body;
        const newOrder = new Order({ address, items, storeId, status: status || 'Σε Εξέλιξη' });
        await newOrder.save();
        res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Λήψη όλων των παραγγελιών (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().populate('storeId');
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Διαγραφή παραγγελίας
router.delete('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json({ message: 'Order deleted successfully', order: deletedOrder });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Ανάθεση παραγγελίας σε διανομέα
router.put('/:id/assign', async (req, res) => {
    try {
        const { assignedTo } = req.body; // Το userId του διανομέα
        const orderId = req.params.id;



        const updatedOrder = await Order.findByIdAndUpdate(orderId,
            { assignedTo }, // Πρέπει να είναι αντικείμενο
            { new: true }
        );

        //console.log('Assigned to:', assignedTo);    
        //console.log('Order ID:', orderId);  

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json({ message: 'Order assigned successfully', order: updatedOrder });
    } catch (err) {
        console.error('Error assigning order:', err);
        res.status(500).json({ error: 'Failed to assign order' });
    }
});

// Λήψη παραγγελιών για συγκεκριμένο διανομέα
router.get('/assigned/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ assignedTo: userId }).populate('storeId');
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching assigned orders:', err);
        res.status(500).json({ error: 'Failed to fetch assigned orders' });
    }
});


// Ενημέρωση κατάστασης παραγγελίας
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Σε Εξέλιξη', 'Ολοκληρώθηκε', 'Ακυρώθηκε'].includes(status)) {
            return res.status(400).json({ message: 'Μη έγκυρη κατάσταση.' });
        }
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ message: 'Η παραγγελία δεν βρέθηκε.' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Σφάλμα κατά την ενημέρωση της κατάστασης.' });
    }
});

module.exports = router