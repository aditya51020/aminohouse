const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }],
    description: { type: String },
    imageUrl: { type: String },
    active: { type: Boolean, default: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
comboSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Combo', comboSchema);
