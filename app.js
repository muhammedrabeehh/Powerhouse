require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// View Engine
app.set('view engine', 'ejs');

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bills', require('./routes/bill'));
app.use('/admin', require('./routes/admin'));
app.use('/user', require('./routes/user'));

// Root & Health
app.get('/', (req, res) => res.render('landing'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Powerhouse Server running on port ${PORT}`);
});


module.exports = app;