const express = require('express');
const router = express.Router();
const {
    createBill,
    getBills,
    uploadPaymentProof,
    approvePayment,
    declinePayment,
    sendBillReminder,
    deleteBill,
    renderAdminCreate,
    renderAdminActive,
    renderAdminCompleted
} = require('../controllers/billController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../utils/upload');

// @route   GET /api/bills/dashboard (Create View)
router.get('/dashboard', protect, admin, renderAdminCreate);

// @route   GET /api/bills/active
router.get('/active', protect, admin, renderAdminActive);

// @route   GET /api/bills/completed
router.get('/completed', protect, admin, renderAdminCompleted);

// @route   GET /api/bills
router.get('/', protect, getBills);

// @route   POST /api/bills (Admin Create)
router.post('/', protect, admin, createBill);

// @route   POST /api/bills/:id/pay (User Upload)
router.post('/:id/pay', protect, upload.single('paymentProof'), uploadPaymentProof);

// @route   PUT /api/bills/:id/approve/:userId (Admin Approve)
router.put('/:id/approve/:userId', protect, admin, approvePayment);

// @route   PUT /api/bills/:id/decline/:userId
router.put('/:id/decline/:userId', protect, admin, declinePayment);

// @route   POST /api/bills/:id/remind (Admin Remind)
router.post('/:id/remind', protect, admin, sendBillReminder);

// @route   DELETE /api/bills/:id
router.delete('/:id', protect, admin, deleteBill);

module.exports = router;
