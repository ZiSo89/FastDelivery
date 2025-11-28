const mongoose = require('mongoose');

const monthlyExpenseSchema = new mongoose.Schema({
  // Year and month for the expense record
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  // Extra expenses amount
  amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Notes about the expenses
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  
  // Who updated it
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Compound unique index for year-month
monthlyExpenseSchema.index({ year: 1, month: 1 }, { unique: true });

// Static method to get or create expense for a month
monthlyExpenseSchema.statics.getOrCreateForMonth = async function(year, month) {
  let expense = await this.findOne({ year, month });
  
  if (!expense) {
    expense = await this.create({ year, month, amount: 0, notes: '' });
  }
  
  return expense;
};

// Static method to update expense for a month
monthlyExpenseSchema.statics.updateForMonth = async function(year, month, amount, notes, adminId) {
  const expense = await this.findOneAndUpdate(
    { year, month },
    { 
      $set: { 
        amount, 
        notes,
        updatedBy: adminId 
      } 
    },
    { new: true, upsert: true, runValidators: true }
  );
  return expense;
};

module.exports = mongoose.model('MonthlyExpense', monthlyExpenseSchema);
