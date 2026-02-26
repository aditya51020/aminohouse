const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unit: { type: String, required: true },
    currentStock: { type: Number, default: 0 },
    minStockLevel: { type: Number, default: 0 },
    costPerUnit: { type: Number, default: 0 },
    manufacturer: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
ingredientSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
