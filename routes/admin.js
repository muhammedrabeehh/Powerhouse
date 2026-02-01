const express = require('express');
const router = express.Router();
const { renderAdminCreate, renderAdminActive, renderAdminCompleted, renderAdminAddUser, renderAdminManageUsers } = require('../controllers/billController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /admin/login
router.get('/login', (req, res) => {
    if (req.cookies.token) return res.redirect('/admin/dashboard');
    res.render('login', { role: 'admin' });
});

// @route   GET /admin/dashboard
router.get('/dashboard', protect, admin, renderAdminCreate);

// @route   GET /admin/bills/active
router.get('/bills/active', protect, admin, renderAdminActive);

// @route   GET /admin/bills/completed
router.get('/bills/completed', protect, admin, renderAdminCompleted);

// @route   GET /admin/users/add
router.get('/users/add', protect, admin, renderAdminAddUser);

// @route   GET /admin/users/manage
router.get('/users/manage', protect, admin, renderAdminManageUsers);

// Redirect /admin/users to /admin/users/manage
router.get('/users', (req, res) => res.redirect('/admin/users/manage'));

module.exports = router;
