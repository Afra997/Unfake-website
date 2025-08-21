const mongoose = require('mongoose');

// This is the blueprint (Schema) for our User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, // A username is required
    unique: true,   // Every username must be unique
    trim: true      // Removes whitespace from the beginning and end
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
    // IMPORTANT: We will encrypt this password later before saving!
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Role must be either 'user' or 'admin'
    default: 'user'         // If no role is specified, it defaults to 'user'
  },
  status: {
    type: String,
    enum: ['active', 'temp-banned', 'perm-banned'],
    default: 'active'
  }
}, {
  // This option automatically adds `createdAt` and `updatedAt` fields
  timestamps: true
});

// This creates the 'construction company' (Model) using the blueprint
const User = mongoose.model('User', userSchema);

// This makes the User model available to be used in other files
module.exports = User;