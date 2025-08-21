const express = require('express');
const router = express.Router();

// Import our "guard" middleware
const authMiddleware = require('../middleware/auth.middleware');
// Import the controller
const postController = require('../controllers/post.controller');

// Define the route for creating a post
// This is a PROTECTED route.
// When a POST request is made to '/', it first runs through authMiddleware.
// If the middleware calls next(), it proceeds to postController.createPost.
router.post('/', authMiddleware, postController.createPost);

// GET /api/posts - Get all approved posts (Public)
router.get('/', postController.getAllPosts);

// GET /api/posts/search?q=<term> - Search for posts (Public) <-- ADD THIS
router.get('/search', postController.searchPosts);

// POST /api/posts/:postId/vote - Vote on a post (Protected) 
router.post('/:postId/vote', authMiddleware, postController.voteOnPost);


module.exports = router;