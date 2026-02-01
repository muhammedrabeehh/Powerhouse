require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Re-added for best practice
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

const cookieParser = require('cookie-parser');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // For form submissions
app.use(cookieParser());

// View Engine
app.set('view engine', 'ejs');

// Static folder for uploads and public assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bills', require('./routes/bill'));

// View Routes
app.use('/admin', require('./routes/admin'));
app.use('/user', require('./routes/user'));



// Health Check & Root Redirect
// Health Check & Root Route
app.get('/', (req, res) => res.render('landing'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Powerhouse Server running on port ${PORT}`);
});