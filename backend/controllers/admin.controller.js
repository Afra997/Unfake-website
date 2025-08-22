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
    // Get all possible fields from the request body
    const { status, adminFlag, adminReason } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create an object to hold only the fields we want to update
    const updates = {};
    if (status) updates.status = status;
    if (adminFlag) updates.adminFlag = adminFlag;
    
    // This is the key change:
    // We check if 'adminReason' was included in the request at all.
    // This allows saving a reason, or clearing it with an empty string.
    if (adminReason !== undefined) {
      updates.adminReason = adminReason;
    }

    // Atomically find the post and update it with the new data
    const updatedPost = await Post.findByIdAndUpdate(postId, updates, { new: true });

    // --- LOGGING --- (Ensure your logging logic is also here)
    if (adminFlag) {
        const logDetails = `Admin flagged post "${updatedPost.title.substring(0, 20)}..." as ${adminFlag}.`;
        const newLog = new AdminLog({ admin: req.user.id, action: 'POST_MODERATED', details: logDetails });
        await newLog.save();
    }
    // --- END LOGGING ---

    res.json(updatedPost);
  } catch (err) {
    console.error("Error in moderatePost:", err);
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
// Get a list of all users WITH their calculated vote counts
exports.getAllUsers = async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const regex = new RegExp(searchTerm, 'i');

        // This is a powerful MongoDB Aggregation Pipeline
        const usersWithVoteCounts = await User.aggregate([
            // Stage 1: Match users based on the search term first (for efficiency)
            {
                $match: {
                    $or: [{ username: regex }, { email: regex }]
                }
            },
            // Stage 2: Join with the 'posts' collection to find their votes
            {
                $lookup: {
                    from: 'posts', // The collection to join with
                    let: { userId: '$_id' },
                    pipeline: [
                        // Find posts where this user's ID is in either vote array
                        { $match: { $expr: { $or: [{ $in: ['$$userId', '$trueVotes'] }, { $in: ['$$userId', '$falseVotes'] }] } } },
                    ],
                    as: 'votedPosts' // The new array field with posts they voted on
                }
            },
            // Stage 3: Add new fields for true/false vote counts
            {
                $addFields: {
                    trueVotesCount: {
                        $size: {
                            // Filter the votedPosts to count only where they voted true
                            $filter: { input: '$votedPosts', as: 'post', cond: { $in: ['$_id', '$$post.trueVotes'] } }
                        }
                    },
                    falseVotesCount: {
                        $size: {
                            // Filter the votedPosts to count only where they voted false
                            $filter: { input: '$votedPosts', as: 'post', cond: { $in: ['$_id', '$$post.falseVotes'] } }
                        }
                    }
                }
            },
            // Stage 4: Remove the large 'votedPosts' array and the password for a clean response
            {
                $project: {
                    username: 1,
                    email: 1,
                    role: 1,
                    status: 1,
                    createdAt: 1,
                    trueVotesCount: 1,
                    falseVotesCount: 1
                }
            }
        ]);

        res.json(usersWithVoteCounts);
    } catch (err) {
        console.error('Error fetching users with vote counts:', err);
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

// NEW: Get user statistics for the pie chart
exports.getUserStatsForChart = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run all count queries in parallel for efficiency
    const [tempBanned, permBanned, newActive, oldActive] = await Promise.all([
      User.countDocuments({ status: 'temp-banned' }),
      User.countDocuments({ status: 'perm-banned' }),
      // New and Active users
      User.countDocuments({ status: 'active', createdAt: { $gte: sevenDaysAgo } }),
      // Old (Established) and Active users
      User.countDocuments({ status: 'active', createdAt: { $lt: sevenDaysAgo } })
    ]);

    res.json({ tempBanned, permBanned, newActive, oldActive });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};