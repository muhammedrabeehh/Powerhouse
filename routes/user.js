const express = require('express');
const router = express.Router();
const { renderUserOverview, renderUserPending, renderUserHistory } = require('../controllers/billController');
const { protect } = require('../middleware/auth');

// @route   GET /user/login
router.get('/login', (req, res) => {
    if (req.cookies.token) return res.redirect('/user/dashboard');
    res.render('login', { role: 'user' });
});

router.get('/dashboard', protect, renderUserOverview);
router.get('/pending', protect, renderUserPending);
router.get('/bills', protect, renderUserHistory);

module.exports = router;
