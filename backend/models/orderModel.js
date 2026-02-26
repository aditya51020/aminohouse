const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
  quantity: { type: Number, required: true },
  customizations: { type: mongoose.Schema.Types.Mixed },
  customizationText: { type: String },
  price: { type: Number }
});

const orderSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  guestDetails: {
    name: { type: String },
    phone: { type: String }
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  orderType: { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' },
  deliveryDetails: {
    address: { type: String },
    slot: { type: String },
    coordinates: { lat: Number, lng: Number }
  },
  discount: {
    couponCode: { type: String },
    amount: { type: Number, default: 0 }
  },
  status: { type: String, default: 'Pending' },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id
orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Order', orderSchema);