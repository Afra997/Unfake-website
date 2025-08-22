const Post = require('../models/post.model');
const User = require('../models/user.model');

// Get all posts that are pending approval (now with search)
exports.getPendingPosts = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const regex = new RegExp(searchTerm, 'i');
    
    const posts = await Post.find({ 
      status: 'pending',
      $or: [{ title: regex }, { description: regex }]
    })
      .sort({ createdAt: 'desc' })
      .populate('submittedBy', 'username email');
    res.json(posts);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Moderate a specific post (approve, flag true, flag false)
exports.moderatePost = async (req, res) => {
  try {
    const { status, adminFlag, adminReason } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (status) post.status = status;
    if (adminFlag) post.adminFlag = adminFlag;
    if (adminReason) post.adminReason = adminReason;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// NEW: Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, pendingPosts, flaggedTrue, flaggedFalse] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ status: 'pending' }),
      Post.countDocuments({ adminFlag: 'true' }),
      Post.countDocuments({ adminFlag: 'false' })
    ]);

    res.json({
      totalUsers, pendingPosts, flaggedTrue, flaggedFalse
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Get a list of all users (now with search)
exports.getAllUsers = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const regex = new RegExp(searchTerm, 'i');

    const users = await User.find({
      $or: [{ username: regex }, { email: regex }]
    }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getAllPostsForAdmin = async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const regex = new RegExp(searchTerm, 'i');
    
    const posts = await Post.find({
      $or: [{ title: regex }, { description: regex }]
    })
      .sort({ createdAt: 'desc' })
      .populate('submittedBy', 'username'); // Or 'username'
    res.json(posts);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Update a user's status (ban, unban, etc.)
exports.manageUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.userId;

    const validStatuses = ['active', 'temp-banned', 'perm-banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status: status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};