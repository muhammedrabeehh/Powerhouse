const Bill = require('../models/Bill');
const User = require('../models/User');
const { sendNewBillNotification, sendReminder, sendPaymentReceipt } = require('../utils/emailService');

// @desc    Admin: Create a new bill and notify users
// @route   POST /api/bills
// @access  Private/Admin
const createBill = async (req, res) => {
    const { totalAmount, description, upiId } = req.body;

    try {
        const users = await User.find({ status: 'active', role: 'user' });

        if (!users || users.length === 0) {
            // Handle case with no users if necessary
        }

        const shareCount = users.length > 0 ? users.length : 1;
        const individualShare = (totalAmount / shareCount).toFixed(2);

        const payments = users.map(user => ({
            user: user._id,
            status: 'Unpaid',
        }));

        const bill = await Bill.create({
            totalAmount,
            individualShare,
            description,
            upiId, // Optional override
            payments,
        });

        // Service Call
        try {
            await sendNewBillNotification(users, bill);
        } catch (emailError) {
            console.error('Email Notification Failed:', emailError.message);
        }

        res.status(201).json(bill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    User: Get bills (with my status)
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
    try {
        const bills = await Bill.find({}).sort({ date: -1 }).populate('payments.user', 'name email');
        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    User: Upload payment proof
// @route   POST /api/bills/:id/pay
// @access  Private
const uploadPaymentProof = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Logic: Find the payment entry for this user
        const paymentIndex = bill.payments.findIndex(
            (p) => p.user.toString() === req.user._id.toString()
        );

        if (paymentIndex === -1) {
            return res.status(404).json({ message: 'User payment entry not found in this bill' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Update Logic
        bill.payments[paymentIndex].screenshotUrl = req.file.path; // Renamed from paymentProof
        bill.payments[paymentIndex].status = 'Pending_Approval';

        await bill.save();

        res.json({ message: 'Payment proof uploaded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Approve payment
// @route   PUT /api/bills/:id/approve/:userId
// @access  Private/Admin
const approvePayment = async (req, res) => {
    try {
        const { message } = req.body; // Custom message
        const bill = await Bill.findById(req.params.id);
        const userId = req.params.userId;

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        const payment = bill.payments.find(p => p.user.toString() === userId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment entry not found' });
        }

        payment.status = 'Paid';
        if (message) payment.adminMessage = message;

        await bill.save();

        res.json({ message: 'Payment approved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Decline payment
// @route   PUT /api/bills/:id/decline/:userId
// @access  Private/Admin
const declinePayment = async (req, res) => {
    try {
        const { message } = req.body; // Custom message
        const bill = await Bill.findById(req.params.id);
        const userId = req.params.userId;

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        const payment = bill.payments.find(p => p.user.toString() === userId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment entry not found' });
        }

        payment.status = 'Declined';
        // We keep the screenshotUrl so they know what was rejected, or we could clear it?
        // Let's keep it but maybe the UI handles re-upload by overwriting.

        if (message) payment.adminMessage = message;

        await bill.save();

        res.json({ message: 'Payment declined' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Send bill reminder
// @route   POST /api/bills/:id/remind
// @access  Private/Admin
const sendBillReminder = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id).populate('payments.user');

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        const unpaidPayments = bill.payments.filter(p => p.status === 'Unpaid');

        try {
            for (const payment of unpaidPayments) {
                // Service Call
                await sendReminder(payment.user, bill);
            }
            res.json({ message: `Reminders sent to ${unpaidPayments.length} users` });
        } catch (emailError) {
            console.error('Email Reminder Failed:', emailError.message);
            // Still return success of the operation, but warn?
            res.json({ message: `Reminders triggered, but some emails failed.` });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Admin: Delete a bill
// @route   DELETE /api/bills/:id
// @access  Private/Admin
const deleteBill = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        await bill.deleteOne();
        res.json({ message: 'Bill removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Render Admin Dashboard (Create Bill)
// @route   GET /admin/dashboard
// @access  Private/Admin
const renderAdminCreate = async (req, res) => {
    try {
        res.render('admin/bills/create', {
            page: 'create',
            user: req.user,
            defaultUpi: process.env.ADMIN_UPI_ID || 'admin@upi'
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

// @desc    Render Admin Active Bills
// @route   GET /admin/bills/active
// @access  Private/Admin
const renderAdminActive = async (req, res) => {
    try {
        const bills = await Bill.find({}).sort({ date: -1 }).populate('payments.user');

        // Filter: Active = Has at least one non-Paid payment
        const activeBills = bills.filter(bill =>
            bill.payments.some(p => p.status !== 'Paid')
        );

        res.render('admin/bills/active', { bills: activeBills, page: 'active', user: req.user });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

// @desc    Render Admin Completed Bills
// @route   GET /admin/bills/completed
// @access  Private/Admin
const renderAdminCompleted = async (req, res) => {
    try {
        const bills = await Bill.find({}).sort({ date: -1 }).populate('payments.user');

        // Filter: Completed = All payments are Paid
        const completedBills = bills.filter(bill =>
            bill.payments.every(p => p.status === 'Paid')
        );

        res.render('admin/bills/completed', { bills: completedBills, page: 'completed', user: req.user });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

// @desc    Render Admin Add User
// @route   GET /admin/users/add
// @access  Private/Admin
const renderAdminAddUser = async (req, res) => {
    try {
        res.render('admin/users/add', { page: 'add_user', user: req.user });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

// @desc    Render Admin Manage Users
// @route   GET /admin/users/manage
// @access  Private/Admin
const renderAdminManageUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        res.render('admin/users/manage', { users, page: 'manage_users', user: req.user });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

// @desc    Render User Overview (Stats)
// @route   GET /user/dashboard
// @access  Private
const renderUserOverview = async (req, res) => {
    try {
        const bills = await Bill.find({}).sort({ date: -1 });
        const userId = req.user._id.toString();

        let totalPaid = 0;
        let totalPending = 0;
        let recentBills = [];

        bills.forEach(bill => {
            const payment = bill.payments.find(p => p.user.toString() === userId);
            if (payment) {
                if (payment.status === 'Paid') {
                    totalPaid += bill.individualShare;
                } else {
                    totalPending += bill.individualShare;
                }

                // Add to recent if within last 5
                if (recentBills.length < 5) {
                    recentBills.push({
                        ...bill.toObject(),
                        myPayment: payment
                    });
                }
            }
        });

        res.render('user/overview', {
            user: req.user,
            stats: { totalPaid, totalPending },
            recentBills,
            page: 'dashboard'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// @desc    Render User Pending Bills
// @route   GET /user/pending
// @access  Private
const renderUserPending = async (req, res) => {
    try {
        const bills = await Bill.find({}).sort({ date: -1 });
        const userId = req.user._id.toString();

        const pendingBills = bills.reduce((acc, bill) => {
            const payment = bill.payments.find(p => p.user.toString() === userId);
            if (payment && (payment.status === 'Unpaid' || payment.status === 'Declined' || payment.status === 'Pending_Approval')) {
                acc.push({
                    ...bill.toObject(),
                    myPayment: payment
                });
            }
            return acc;
        }, []);

        res.render('user/pending', {
            user: req.user,
            bills: pendingBills,
            page: 'pending',
            upiId: process.env.ADMIN_UPI_ID || 'admin@upi' // Fallback
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// @desc    Render User History/All Bills
// @route   GET /user/bills
// @access  Private
const renderUserHistory = async (req, res) => {
    try {
        const bills = await Bill.find({}).sort({ date: -1 });
        const userId = req.user._id.toString();

        const allBills = bills.map(bill => {
            const payment = bill.payments.find(p => p.user.toString() === userId);
            return {
                ...bill.toObject(),
                myPayment: payment || { status: 'Not Involved' }
            };
        });

        res.render('user/bills', {
            user: req.user,
            bills: allBills,
            page: 'bills'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createBill,
    getBills,
    uploadPaymentProof,
    approvePayment,
    declinePayment,
    sendBillReminder,
    deleteBill,
    renderAdminCreate,
    renderAdminActive,
    renderAdminCompleted,
    renderAdminAddUser,
    renderAdminManageUsers,
    renderUserOverview,
    renderUserPending,
    renderUserHistory
};
