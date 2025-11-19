const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String
  },
  
  // Customer info
  customer: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Το τηλέφωνο πρέπει να είναι 10ψήφιο']
    },
    address: {
      type: String,
      required: true
    }
  },
  
  // Order content
  orderType: {
    type: String,
    enum: ['text', 'voice'],
    required: true
  },
  orderContent: {
    type: String,
    default: ''
  },
  orderVoiceUrl: {
    type: String,
    default: null
  },
  
  // Store
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  storeName: {
    type: String,
    required: true
  },
  
  // Pricing
  productPrice: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  
  // Driver
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  driverName: {
    type: String,
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'pending_store',
      'pricing',
      'pending_admin',
      'pending_customer_confirm',
      'confirmed',
      'assigned',
      'accepted_driver',
      'preparing',
      'in_delivery',
      'completed',
      'cancelled',
      'rejected_store',
      'rejected_driver'
    ],
    default: 'pending_store'
  },
  
  statusHistory: [{
    status: String,
    updatedBy: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  confirmedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ storeId: 1 });
orderSchema.index({ driverId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const now = new Date();
    // Use local date instead of UTC
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Get today's start and end (local timezone)
    const todayStart = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Find the last order number for today
    const lastOrder = await mongoose.model('Order')
      .findOne({
        orderNumber: new RegExp(`^ORD-${dateStr}-`),
        createdAt: { $gte: todayStart, $lt: todayEnd }
      })
      .sort({ orderNumber: -1 })
      .select('orderNumber');
    
    let nextNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastNum = parseInt(lastOrder.orderNumber.split('-')[2]);
      nextNumber = lastNum + 1;
    }
    
    this.orderNumber = `ORD-${dateStr}-${String(nextNumber).padStart(4, '0')}`;
  }
  next();
});

// Update statusHistory on status change
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this._updatedBy || 'system',
      timestamp: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
