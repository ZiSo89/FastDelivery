const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    address: { type: String, required: true },
    items: { type: String, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Διανομέας
    status: {
        type: String,
        enum: ['Σε Εξέλιξη', 'Ολοκληρώθηκε', 'Ακυρώθηκε'], // Μεταφρασμένες καταστάσεις
        default: 'Σε Εξέλιξη' // Αφαίρεση του Pending
    }, // Προσθήκη πεδίου status
    cost: { type: Number, required: false, default: 0 }, // Προσθήκη πεδίου cost
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);