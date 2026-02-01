const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    totalAmount: {
        type: Number,
        required: true,
    },
    individualShare: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
    },
    upiId: {
        type: String,
        required: true,
    },
    payments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            status: {
                type: String,
                enum: ['Unpaid', 'Pending_Approval', 'Paid', 'Declined'],
                default: 'Unpaid',
            },
            screenshotUrl: {
                type: String, // URL or path to the uploaded image
            },
            adminMessage: {
                type: String, // Custom message from admin
            },
        },
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Bill', billSchema);
