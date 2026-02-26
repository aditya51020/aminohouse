const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    name: { type: String },
    amount: { type: Number },
    unit: { type: String },
    type: { type: String, enum: ['addition', 'deduction', 'adjustment'], default: 'deduction' },
    reason: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
inventoryLogSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
