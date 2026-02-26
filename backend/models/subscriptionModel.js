const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // in days
    description: { type: String },
    menuItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }],
    dailyLimit: { type: Number, default: 1 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
subscriptionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
