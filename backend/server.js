// 1. Import all the packages we need
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // This line loads the .env file

// 2. Set up the Express app
const app = express();
const PORT = 5000; // We'll use port 5000 for our backend

// 3. Set up middleware
app.use(cors()); // Allows your frontend to talk to your backend
app.use(express.json()); // Allows the server to understand JSON data

// 4. Connect to the MongoDB database
// process.env.DATABASE_URL is the connection string from your .env file
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

  // NEW: API Routes
const authRoutes = require('./routes/auth.routes'); // Import the auth routes
app.use('/api/auth', authRoutes); // Tell Express to use them


const postRoutes = require('./routes/post.routes'); // <-- ADD THIS
app.use('/api/posts', postRoutes);

const adminRoutes = require('./routes/admin.routes'); // <-- ADD THIS
app.use('/api/admin', adminRoutes);

// 5. Create a test route to make sure the server is working
app.get('/', (req, res) => {
  res.send('Welcome to the UNFAKE Backend API!');
});

// 6. Start listening for requests
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});