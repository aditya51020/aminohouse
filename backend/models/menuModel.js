const mongoose = require('mongoose');

const recipeItemSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantityRequired: { type: Number, required: true }
});

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  category: { type: String, required: true },
  imageUrl: { type: String },
  inStock: { type: Boolean, default: true },
  isSubscriptionItem: { type: Boolean, default: false },
  quantity: { type: Number, default: 0 },
  availability: {
    isTimeBound: { type: Boolean, default: false },
    start: { type: String, default: '00:00' },
    end: { type: String, default: '23:59' }
  },
  recipe: [recipeItemSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id
menuSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Menu', menuSchema);