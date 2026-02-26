const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  loyaltyPoints: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  visitCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id
customerSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Customer', customerSchema);