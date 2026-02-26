const mongoose = require('mongoose');

const subscriptionUsageSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
subscriptionUsageSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);
