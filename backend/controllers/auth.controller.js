const User = require('../models/user.model'); // Import the User model
const bcrypt = require('bcryptjs');           // Import bcrypt for password hashing
const jwt = require('jsonwebtoken');

// This is the function that will handle user registration
exports.signup = async (req, res) => {
  try {
    // 1. Get user data from the incoming request body
    const { username, email, password } = req.body;

    // 2. Check if a user with that email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      // If the user exists, send a 400 (Bad Request) error
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    // 3. Hash the password for security
    const salt = await bcrypt.genSalt(10); // Generate a "salt"
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

    // 4. Create a new user instance using our User model
    const newUser = new User({
      username,
      email,
      password: hashedPassword, // Store the HASHED password, not the original
    });

    // 5. Save the new user to the database
    const savedUser = await newUser.save();

    // 6. Send a success response
    // 201 means "Created"
    res.status(201).json({
      message: 'User created successfully!',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email
      }
    });

  } catch (error) {
    // If any error occurs, send a 500 (Internal Server Error) response
    res.status(500).json({ message: 'Something went wrong.', error: error.message });
  }
};

// This is the new function that will handle user login
exports.login = async (req, res) => {
  try {
    // 1. Get username and password from the request body
    const { username, password } = req.body;

    // 2. Find the user in the database by their username
    const user = await User.findOne({ username });
    if (!user) {
      // If user is not found, send a 401 (Unauthorized) error
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // If passwords don't match, send the same error
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 4. If credentials are correct, create the JWT payload
    const payload = {
      user: {
        id: user._id,
        role: user.role // Include the user's role in the token
      }
    };

    // 5. Sign the token with a secret key
    // This creates the JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Your secret key
      { expiresIn: '1d' },    // Token expires in 1 day
      (err, token) => {
        if (err) throw err;
        // 6. Send the token back to the client
        res.json({
          message: 'Logged in successfully!',
          token,
          user: {
             username: user.username,
             role: user.role
          }
        });
      }
    );

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.', error: error.message });
  }
};