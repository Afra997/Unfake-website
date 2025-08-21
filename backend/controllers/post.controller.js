const Post = require('../models/post.model'); // Import the Post model

// This function will handle creating a new post
exports.createPost = async (req, res) => {
  try {
    // 1. Get the post details from the request body
    const { title, source, description } = req.body;

    // 2. Create a new post object
    const newPost = new Post({
      title,
      source,
      description,
      // req.user.id comes from our authentication middleware!
      submittedBy: req.user.id
    });

    // 3. Save the post to the database
    const post = await newPost.save();

    // 4. Send a success response
    res.status(201).json(post);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// NEW: This function will get all approved posts
exports.getAllPosts = async (req, res) => {
  try {
    // 1. Find all posts in the database that have a status of 'approved'
    const posts = await Post.find({ status: 'approved' })
      // 2. Sort them by creation date, newest first
      .sort({ createdAt: -1 })
      // 3. Populate the 'submittedBy' field to include the username
      //    We only select the 'username' field to avoid sending sensitive user data
      .populate('submittedBy', 'username'); 

    // 4. Send the found posts as a JSON response
    res.json(posts);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// NEW: This function handles voting on a post
exports.voteOnPost = async (req, res) => {
  try {
    // 1. Get the post ID from the URL parameters
    const postId = req.params.postId;
    // 2. Get the vote type ('true' or 'false') from the request body
    const { voteType } = req.body;
    // 3. Get the user's ID from our auth middleware
    const userId = req.user.id;

    // 4. Find the post in the database
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // 5. Check if the voteType is valid
    if (voteType !== 'true' && voteType !== 'false') {
      return res.status(400).json({ message: 'Invalid vote type.' });
    }

    // 6. LOGIC: Add or remove the user's vote
    if (voteType === 'true') {
      // If user already voted true, do nothing (or remove vote - we'll keep it simple for now)
      if (post.trueVotes.includes(userId)) {
         return res.json(post);
      }
      // Add user to trueVotes and remove from falseVotes if they exist there
      post.trueVotes.push(userId);
      post.falseVotes.pull(userId); // .pull() is a Mongoose helper to remove an item from an array
    } 
    else if (voteType === 'false') {
      // If user already voted false, do nothing
      if (post.falseVotes.includes(userId)) {
        return res.json(post);
      }
      // Add user to falseVotes and remove from trueVotes
      post.falseVotes.push(userId);
      post.trueVotes.pull(userId);
    }

    // 7. Save the updated post to the database
    await post.save();

    // 8. Send back the updated post
    res.json(post);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// NEW: This function will search for posts
exports.searchPosts = async (req, res) => {
  try {
    // 1. Get the search term from the query parameter (e.g., /search?q=virus)
    const searchTerm = req.query.q;

    // 2. Create a case-insensitive regular expression from the search term
    const regex = new RegExp(searchTerm, 'i'); // 'i' makes it case-insensitive

    // 3. Find all 'approved' posts where the title OR the description matches the regex
    const posts = await Post.find({
      status: 'approved',
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } }
      ]
    }).populate('submittedBy', 'username'); // Also get the username

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};