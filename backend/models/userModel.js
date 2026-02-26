const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'cashier' }, // 'admin', 'kitchen', 'cashier'
  name: { type: String },
  email: { type: String, unique: true, sparse: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id to match frontend
userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('User', userSchema);