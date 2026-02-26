const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
settingSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Setting', settingSchema);
