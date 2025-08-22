const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

// GET /api/admin/pending-posts - Get all pending posts
router.get('/pending-posts', [authMiddleware, adminMiddleware], adminController.getPendingPosts);

// PUT /api/admin/posts/:postId/moderate - Update a post's status/flag
router.put('/posts/:postId/moderate', [authMiddleware, adminMiddleware], adminController.moderatePost);

// DELETE /api/admin/posts/:postId - Delete a post  <-- NEW
router.delete('/posts/:postId', [authMiddleware, adminMiddleware], adminController.deletePost);

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', [authMiddleware, adminMiddleware], adminController.getDashboardStats);

// GET /api/admin/users - Get all users
router.get('/users', [authMiddleware, adminMiddleware], adminController.getAllUsers);

// PUT /api/admin/users/:userId/status - Change a user's status
router.put('/users/:userId/status', [authMiddleware, adminMiddleware], adminController.manageUserStatus);

router.get('/posts', [authMiddleware, adminMiddleware], adminController.getAllPostsForAdmin);

module.exports = router;