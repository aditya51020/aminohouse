const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    active: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    redirectType: { type: String },
    redirectId: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
adSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Ad', adSchema);
