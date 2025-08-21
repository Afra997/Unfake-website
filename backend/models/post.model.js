const mongoose = require('mongoose');
const Schema = mongoose.Schema; // A shorthand for mongoose.Schema

// This is the blueprint (Schema) for our Post
const postSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  // This creates a link to the User model
  // It stores the unique ID of the user who submitted the post
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User' // This tells Mongoose the ID belongs to a document in the 'User' collection
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  // These will store arrays of User IDs for those who voted
  trueVotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  falseVotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  adminFlag: {
    type: String,
    enum: ['unverified', 'true', 'false'],
    default: 'unverified'
  },
  adminReason: {
    type: String,
    default: '' // Optional reason from the admin
  }
}, {
  timestamps: true
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;