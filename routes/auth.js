const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUsers, renderLogin, logoutUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /login (Render View)
router.get('/login', renderLogin); // Changed from /api/auth/login to just be handled here? No, app.js mounts at /api/auth. So this is /api/auth/login (GET).
// Actually, user likely wants localhost:5001/login.
// We should probably mount these view routes at root level in app.js, or just let them be /api/auth/login for now as per prompt "provide updated app.js".
// Prompt said: "app.js configuration ... code for dashboard".
// I will keep them here for now, but commonly views are root. 
// Let's stick to the prompt's structural constraint or add a 'viewRoutes.js'.
// Antigravity says "Route separation".
// I'll make them accessible via the existing routers for simplicity in this turn, or better, make a new 'web.js' route file?
// The prompt asked for "updated app.js configuration", "admin-dashboard.ejs".
// "Controller Integration": Update existing controllers.
// So, I will just add the routes here.

// @route   POST /api/auth/login
router.post('/login', loginUser);

// @route   POST /api/auth/users (Admin Create)
router.post('/users', protect, admin, registerUser);

// @route   GET /api/auth/users (Admin View)
router.get('/users', protect, admin, getUsers);

// @route   GET /api/auth/logout
router.get('/logout', logoutUser);

module.exports = router;
