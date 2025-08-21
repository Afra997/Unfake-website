const express = require('express');
const router = express.Router();

// Import the controller function we just created
const authController = require('../controllers/auth.controller');

// Define the route
// When a POST request is made to '/signup', execute the signup function
router.post('/signup', authController.signup);

// NEW: Login Route
router.post('/login', authController.login);

// We will add more routes here later (like '/login')

module.exports = router;